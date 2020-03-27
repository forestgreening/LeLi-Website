Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
};

Math.dist = function(x1,y1,x2,y2) {
    var a = x1 - x2;
    var b = y1 - y2;

    return Math.sqrt( a*a + b*b );
};

class Icosahedron{

  constructor(mode,position,radius){
    this.mode = mode;
    this.radius = radius;
    this.position = position;
    this.topPent = [];
    this.bottomPent = [];
    this.points = [];
    this.faces = [];
    this.angle = 0;
    this.rotation = new p5.Vector();
    this.init();
  }

  // calculate geometry
  init(){
    this.c = Math.dist(
        Math.cos(0)*this.radius, 
        Math.sin(0)*this.radius, 
        Math.cos(Math.radians(72))*this.radius,  
        Math.sin(Math.radians(72))*this.radius
    );
    this.b = this.radius;
    this.a = (Math.sqrt(((this.c*this.c)-(this.b*this.b))));

    this.triHt = (Math.sqrt((this.c*this.c)-((this.c/2)*(this.c/2))));

    for (var i=0; i<5; i++){
        var point = new Point(
            new p5.Vector(
                Math.cos(this.angle)*this.radius, 
                this.triHt/2.0, 
                Math.sin(this.angle)*this.radius
            )
        , this);
        this.topPent.push(point);
        this.points.push(point);

        this.angle+=Math.radians(72);
    }
    var point = new Point(new p5.Vector(0, this.triHt/2.0+this.a, 0),this);
    this.topPoint = point;
    this.points.push(point);

    this.angle = 72.0/2.0;
    for (var i=0; i<5; i++){
        var point = new Point(
            new p5.Vector(
                Math.cos(this.angle)*this.radius, 
                -this.triHt/2.0, 
                Math.sin(this.angle)*this.radius
            )
        ,this);
        this.bottomPent.push(point);
        this.points.push(point);

        this.angle+=Math.radians(72);
    }
    var point = new Point(
        new p5.Vector(
            0, 
            -(this.triHt/2.0+this.a), 
            0
        )
    ,this);
    this.bottomPoint = point;
    this.points.push(point);

    this.create();
  }

  create(){
      console.log("create");
    // top and bottom
    for (var i=0; i<this.topPent.length; i++){
        
        if (i<this.topPent.length-1){
            this.triangle(this.mode,[ this.topPent[i], this.topPoint, this.topPent[i+1] ]);
        }
        else {
            this.triangle(this.mode,[ this.topPent[i], this.topPoint, this.topPent[0] ]);
        }
        
        if (i<this.bottomPent.length-1){
            this.triangle(this.mode,[ this.bottomPent[i], this.bottomPoint, this.bottomPent[i+1] ]);
        } 
        else {
            this.triangle(this.mode,[ this.bottomPent[i], this.bottomPoint, this.bottomPent[0] ]);
        }
    }

    // body
    for (var i=0; i<this.topPent.length; i++){

        if (i<this.topPent.length-2){
            this.triangle(this.mode,[ this.topPent[i], this.bottomPent[i+1], this.bottomPent[i+2] ]);
            this.triangle(this.mode,[ this.bottomPent[i+2], this.topPent[i], this.topPent[i+1] ]);
        } 
        else if (i==this.topPent.length-2){
            this.triangle(this.mode,[ this.topPent[i], this.bottomPent[i+1], this.bottomPent[0] ]);
            this.triangle(this.mode,[ this.bottomPent[0], this.topPent[i], this.topPent[i+1] ]);
        }
        else if (i==this.topPent.length-1){
            this.triangle(this.mode,[ this.topPent[i], this.bottomPent[0], this.bottomPent[1] ]);
            this.triangle(this.mode,[ this.bottomPent[1], this.topPent[i], this.topPent[0] ]);
        }
      }
  }

    initHandle(){

    }

    update(){

    }

    display(){

    }

    run(){
        this.update();
        this.display();
    }

    triangle(mode,points){
        if(mode == "Face") new Face(points);
        else if(mode == "Line")
        for(var i=0; i<points.length; i++){
            new Line([points[i], points[ i!=(points.length-1)?i+1:0 ]]);
        }
    }
}



class Point{
    constructor(position, parent = null){
        
        this.pos_default = position;
        this.position = position.copy();
        this.vel = new p5.Vector();
        this.acc = new p5.Vector();
        this.isMoving = false;
        this.visible = false;

        this.parent = parent;

        if(this.parent)this.dPosition = p5.Vector.add( this.parent.position, this.pos_default );
        else this.dPosition = this.position;

        global_points.push(this);
    }

    update(){
        if(this.isMoving){
            this.vel.add(this.acc);
            this.dPosition.add(this.vel);
            this.acc.mult(0);
        }
        else{
            if(this.parent){
                var copy = rotate3D(this.pos_default, this.parent.rotation.y, this.parent.rotation.x, 0);
                this.dPosition.x = this.parent.position.x + copy.x;
                this.dPosition.y = this.parent.position.y + copy.y;
                this.dPosition.z = this.parent.position.z + copy.z;
            }
        }
    }

    applyForce(force){
        this.acc.add(force);
    }

    display(){
        if(this.visible){
            pg.strokeWeight(10 * resolutionRatio);
            pg.stroke(255,255*lineRatio);
            var p = this.dPosition;
            pg.point(p.x, p.y, p.z);
        }
    }

    run(){
        this.update();
        this.display();
    }
}

class Line{
    constructor(points){
        this.points = points;
        this.visible = true;
        this.animationTiming = random(0,Math.PI*2);
        global_lines.push(this);
    }
    update(){

    }
    display(){
        if(this.visible){
            pg.strokeWeight(5 * resolutionRatio);
            pg.stroke(255,255*lineRatio);
            pg.noFill();
            pg.beginShape();
            for (let i = 0; i<this.points.length; i++) {
                var p = this.points[i].dPosition;
                pg.vertex(p.x, p.y, p.z);
            }
            pg.endShape(CLOSE);
        }
    }
    run(){
        this.update();
        this.display();
    }
}

class Face{
    constructor(points){
        this.points = points;
        this.visible = true;
        global_faces.push(this);
    }

    update(){

    }

    display(){
        if(this.visible){
            pg.noStroke();;
            pg.fill(255*faceRatio);
            pg.beginShape();
            for (let i = 0; i<this.points.length; i++) {
                var p = this.points[i].dPosition.copy();
                pg.vertex(p.x, p.y, p.z);
            }
            pg.endShape(CLOSE);

            pg.stroke(0);
            pg.strokeWeight(5 * resolutionRatio);
            pg.noFill();
            pg.beginShape();
            for (let i = 0; i<this.points.length; i++) {
                var p = this.points[i].dPosition.copy();
                pg.vertex(p.x, p.y, p.z);
            }
            pg.endShape(CLOSE);
        }
    }
    run(){
        this.update();
        this.display();
    }
}

function rotate3D(p, pitch, roll, yaw) {
    var cosa = Math.cos(yaw);
    var sina = Math.sin(yaw);

    var cosb = Math.cos(pitch);
    var sinb = Math.sin(pitch);

    var cosc = Math.cos(roll);
    var sinc = Math.sin(roll);

    var Axx = cosa*cosb;
    var Axy = cosa*sinb*sinc - sina*cosc;
    var Axz = cosa*sinb*cosc + sina*sinc;

    var Ayx = sina*cosb;
    var Ayy = sina*sinb*sinc + cosa*cosc;
    var Ayz = sina*sinb*cosc - cosa*sinc;

    var Azx = -sinb;
    var Azy = cosb*sinc;
    var Azz = cosb*cosc;


    var px = p.x;
    var py = p.y;
    var pz = p.z;


    var npx = Axx*px + Axy*py + Axz*pz;
    var npy = Ayx*px + Ayy*py + Ayz*pz;
    var npz = Azx*px + Azy*py + Azz*pz;
    return new p5.Vector(npx,npy,npz);
}