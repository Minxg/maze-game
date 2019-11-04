var Maze = function(doc, elemId) {
  this.canvas = doc.getElementById(elemId);
  this.width = this.canvas.width;
  this.height = this.canvas.height;
  this.ctx = this.canvas.getContext('2d');
  this.horizCells = 100;
  this.vertCells = 100;
  this.generator = new MazeGenerator(this.horizCells, this.vertCells);
  this.cellWidth = this.width / this.horizCells;
  this.cellHeight = this.height / this.vertCells;

  var self = this;
  var lineWidth = 1
  self.ctx.strokeStyle = "rgb(0, 0, 0)";
  self.ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
  self.ctx.lineWidth = lineWidth;
  self.charactor = null;

  return {
    width: function() {
      return self.width;
    },

    height: function() {
      return self.height;
    },

    generate: function () {
      var waitElem = $('#pleasewait');
      waitElem.show();
      self.generator.generate();
      this.drawBorders();
      this.drawMaze();
      this.drawCharactor();
      waitElem.hide();
    },

    nextLevel: function () {
      self.ctx.clearRect(0, 0, self.width, self.height)
      self.horizCells += 50;
      self.vertCells += 50;
      self.cellWidth = self.width / self.horizCells;
      self.cellHeight = self.height / self.vertCells;
      self.generator = new MazeGenerator(self.horizCells, self.vertCells);
      this.generate()
    },
    
    draw: function() {
      this.drawBorders();
      this.drawMaze();
      this.drawCharactor();
    },

    drawCharactor: function() {
      var pos = {
        x: 0,
        y: 0,
      }
      var drawArgs = function () {
        return {
          x: pos.x * self.cellWidth + self.cellWidth * 0.1,
          y: pos.y * self.cellHeight + self.cellHeight * 0.1,
          width: self.cellWidth * 0.8,
          height: self.cellHeight * 0.8
        };
      }

      if (!self.charactor) {
        self.charactor = new Image()
        self.charactor.onload = drawCharactor;
        self.charactor.src = './avatar.png'
        window.addEventListener('keydown', (ev) => {
          switch (ev.keyCode) {
            case 37:
              // console.log('left');
              if (isMoveLegal(pos.x, pos.y, pos.x - 1, pos.y)) {
                clearCharactor();
                pos.x = pos.x - 1;
                drawCharactor()
              }
              break;
            case 38:
              // console.log('up');
              if (isMoveLegal(pos.x, pos.y, pos.x, pos.y - 1)) {
                clearCharactor();
                pos.y = pos.y - 1;
                drawCharactor()
              }
              break;
            case 39:
              // console.log('right');
              if (isMoveLegal(pos.x, pos.y, pos.x + 1, pos.y)) {
                clearCharactor();
                pos.x = pos.x + 1;
                drawCharactor()
              }
              break;
            case 40:
              // console.log('down');
              if (isMoveLegal(pos.x, pos.y, pos.x, pos.y + 1)) {
                clearCharactor();
                pos.y = pos.y + 1;
                drawCharactor()
              }
              break;
            default:
              ;
          }
        }, false)
      }

      function drawCharactor() {
        var args = drawArgs()
        self.ctx.drawImage(
          self.charactor,
          args.x,
          args.y,
          args.width,
          args.height
        );
      }
      function clearCharactor() {
        var args = drawArgs()
        self.ctx.clearRect(
          args.x,
          args.y,
          args.width,
          args.height
        );
      }

      const onWin = () => {
        console.log('You Win!');
        this.nextLevel()
        clearCharactor();
        pos.x = 0
        pos.y = 0
        drawCharactor()
      }
      function isMoveLegal(x, y, nextX, nextY) {
        // out of borders detect
        if (nextX === self.horizCells - 1 && nextY === self.vertCells) {
          onWin();
          return false
        }
        if (nextX < 0 || nextY < 0 || nextX >= self.horizCells || nextY > self.vertCells) {
          return false
        }
        // collision detect
        var graph = self.generator.graph;
        var removedEdges = graph.removedEdges;
        var canMoveThrough = _.detect(removedEdges, function(edge) {
          return (
            (edge[0].x === x &&
              edge[0].y === y &&
              edge[1].x === nextX &&
              edge[1].y === nextY) ||
            (edge[0].x === nextX &&
              edge[0].y === nextY &&
              edge[1].x === x &&
              edge[1].y === y)
          );
        });
        return !!canMoveThrough
      }
    },

    solve: function() {
      self.generator.solve();
      this.drawSolution();
    },

    drawBorders: function() {
      this.drawLine(self.cellWidth, 0, self.width, 0);
      this.drawLine(self.width, 0, self.width, self.height);
      this.drawLine(self.width - self.cellWidth, self.height, 0, self.height);
      this.drawLine(0, self.height, 0, 0);
    },

    drawSolution: function() {
      var path = self.generator.path;
      
      for(var i = 0; i < path.length; i++) {
        (function () {
          var cell = path[i];
          var x = cell.x * self.cellWidth;
          var y = cell.y * self.cellHeight;
          setTimeout(function() {
            self.ctx.fillRect(x, y, self.cellWidth, self.cellHeight);
          }, 0.01 * i);
        })();
      }
    },

    drawMaze2: function() {
      var graph = self.generator.graph;
      var removedEdges = graph.removedEdges;
      var width = graph.width;
      var height = graph.height;
      for(var i = 0; i < width - 1; i++) {
        var x = self.cellWidth * (i + 1);
        this.drawLine(x, 0, x, height * self.height);
      }
      for (var j = 0; j < height - 1; j++) {
        var y = self.cellWidth * (j + 1);
        this.drawLine(0, y, width * self.width, y);
      }
      removedEdges.forEach(function(edge) {
        var cell1 = edge[0]
        var cell2 = edge[1]
        if (cell1.x === cell2.x) {
          var y = Math.max(cell1.y, cell2.y) * self.cellHeight
          // self.ctx.clearRect(cell1.x * self.cellWidth + lineWidth, y, (cell2.x + 1) * self.cellWidth - lineWidth, lineWidth)
          this.clipLine(cell1.x * self.cellWidth + lineWidth, y, (cell2.x + 1) * self.cellWidth - lineWidth, y)
        }
        if (cell1.y === cell2.y) {
          var x = Math.max(cell1.x, cell2.x) * self.cellHeight
          // self.ctx.clearRect(x, cell1.y * self.cellHeight + lineWidth, lineWidth, (cell2.y + 1) * self.cellHeight - lineWidth)
          this.clipLine(x, cell1.y * self.cellHeight + lineWidth, x, (cell2.y + 1) * self.cellHeight - lineWidth)
        }
        // var edgeLine = 
      }, this)
    },

    drawMaze: function() {
      var graph = self.generator.graph;
      var drawnEdges = [];

      var edgeAlreadyDrawn = function(cell1, cell2) {
        return _.detect(drawnEdges, function(edge) {
          return _.include(edge, cell1) && _.include(edge, cell2);
        }) != undefined;
      };

      for(var i = 0; i < graph.width; i++) {
        for(var j = 0; j < graph.height; j++) {
          var cell = graph.cells[i][j];
          var topCell = graph.getCellAt(cell.x, cell.y - 1);
          var leftCell = graph.getCellAt(cell.x - 1, cell.y);
          var rightCell = graph.getCellAt(cell.x + 1, cell.y);
          var bottomCell = graph.getCellAt(cell.x, cell.y + 1);
          
          if(!edgeAlreadyDrawn(cell, topCell) && graph.areConnected(cell, topCell)) {
            var x1 = cell.x * self.cellWidth;
            var y1 = cell.y * self.cellHeight;
            var x2 = x1 + self.cellWidth;
            var y2 = y1;
            
            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, topCell]);
          }

          if(!edgeAlreadyDrawn(cell, leftCell) && graph.areConnected(cell, leftCell)) {
            var x2 = x1;
            var y2 = y1 + self.cellHeight;
            
            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, leftCell]);
          }

          if(!edgeAlreadyDrawn(cell, rightCell) && graph.areConnected(cell, rightCell)) {
            var x1 = (cell.x * self.cellWidth) + self.cellWidth;
            var y1 = cell.y * self.cellHeight;
            var x2 = x1;
            var y2 = y1 + self.cellHeight;
            
            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, rightCell]);
          }

          if(!edgeAlreadyDrawn(cell, bottomCell) && graph.areConnected(cell, bottomCell)) {
            var x1 = cell.x * self.cellWidth;
            var y1 = (cell.y * self.cellHeight) + self.cellHeight;
            var x2 = x1 + self.cellWidth;
            var y2 = y1;
            
            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, bottomCell]);
          }          
        }
      }
    },

    clipLine: function (x1, y1, x2, y2) {
      // self.ctx.lineCap = "round";　　//设置线条两端为圆弧
      // self.ctx.lineJoin = "round";　　//设置线条转折为圆弧
      self.ctx.lineWidth = 5;
      // self.ctx.strokeStyle = "rgb(0, 0, 0, 1)";
      self.ctx.globalCompositeOperation = "destination-out";
      self.ctx.save()
      self.ctx.beginPath();
      self.ctx.moveTo(x1, y1);
      self.ctx.lineTo(x2, y2);
      self.ctx.stroke();
      self.ctx.restore();
    },

    drawLine: function(x1, y1, x2, y2) {
      self.ctx.beginPath();
      self.ctx.moveTo(x1, y1);
      self.ctx.lineTo(x2, y2);
      self.ctx.stroke();
    }
  };
};