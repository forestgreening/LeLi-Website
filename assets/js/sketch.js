var shapes = [];
var global_points = [],
  global_lines = [],
  global_faces = [];
var mouse = new p5.Vector(1, 1);
var cameraPos = new p5.Vector(0, 0, 1000);
var program;
var cv;
var pg, colorMask, whiteMask;
var lineRatio = 1,
  faceRatio = 1;
var effectVal = 0;
var effectValTarget = 1;
var isLine = false;

var effectNum = 0;
var isStarted = false;
var isFinished = false;
var resizingSetting = {
  frameCount: 0,
  isResizing: false
};
var resolutionRatio = (innerWidth * innerHeight) / (1080 * 1920);

document.getElementById("btn-skip").addEventListener("click", finishIntro);

function startIntro() {
  document.getElementById("intro-section").classList.add("started");
  document.querySelector("body").classList.add("not-scroll");
  document.getElementById("intro-section").classList.remove("end");
  isFinished = false;
}
function finishIntro() {
  document.querySelector("body").classList.remove("not-scroll");
  document.getElementById("intro-section").classList.add("end");
  isFinished = true;
}

function setup() {
  cv = createCanvas(windowWidth, windowHeight, WEBGL);
  cv.parent("graphic-container");
  pg = createGraphics(width, height, WEBGL);
  colorMask = createGraphics(width, height);
  whiteMask = createGraphics(width, height);

  pg.perspective(PI / 5.0, width / height, 0.1, 5000);

  shapes.push(new Icosahedron("Line", new p5.Vector(), 303));
  shapes.push(new Icosahedron("Face", new p5.Vector(), 300));
  cameraPos = new p5.Vector(0, 0, 2000);

  gl = this.canvas.getContext("webgl");
  program = createShader(vert, frag);

  slideList = getTextSlideList();

  console.log(resolutionRatio);
}

function windowResized() {
  resizingSetting.frameCount = frameCount;
  resizingSetting.isResizing = true;
  resolutionRatio = (innerWidth * innerHeight) / (1080 * 1920);
  pg.perspective(PI / 5.0, width / height, 0.1, 7000 * resolutionRatio);
  console.log(resolutionRatio);
}

function resize() {
  if (
    resizingSetting.frameCount + 15 < frameCount &&
    resizingSetting.isResizing
  ) {
    resizeCanvas(windowWidth, windowHeight);
    pg = createGraphics(width, height, WEBGL);
    colorMask = createGraphics(width, height);
    whiteMask = createGraphics(width, height);
    pg.perspective(PI / 5.0, width / height, 0.1, 3000);
    resizingSetting.isResizing = false;
  }
}

function draw() {
  resize();
  if (target_sc) {
    sc = lerp(sc, target_sc, 0.1);

    if (abs(target_sc - sc) < 1) {
      sc = target_sc;
      target_sc = null;
    }
  }
  scroll_setting();

  cameraMoving();
  pg.camera(cameraPos.x, cameraPos.y, cameraPos.z, 0, 0, 0, 0, 1, 0);
  pg.background(0);
  for (var i = 0; i < global_points.length; i++) {
    global_points[i].run();
  }

  for (var i = 0; i < global_lines.length; i++) {
    global_lines[i].run();
  }

  for (var i = 0; i < global_faces.length; i++) {
    global_faces[i].run();
  }

  for (var i = 0; i < shapes.length; i++) {
    shapes[i].run();
  }

  if (
    slideList[slideCount].kind == "text" ||
    (slideList[slideCount + 1] && slideList[slideCount + 1].kind == "text")
  ) {
    var slideListTemp;
    if (slideList[slideCount].kind == "text")
      slideListTemp = slideList[slideCount];
    if (slideList[slideCount + 1] && slideList[slideCount + 1].kind == "text")
      slideListTemp = slideList[slideCount + 1];

    drawText(slideListTemp);
  }
  program.setUniform("resolution", [width, height]);
  program.setUniform("tex0", pg);
  program.setUniform("colorMask", colorMask);
  program.setUniform("whiteMask", whiteMask);
  program.setUniform("time", frameCount * 0.03);
  program.setUniform("tr", 1.0 - transitionRatio);
  program.setUniform("transitionRatio", transitionRatio);

  shader(program);
  rect(0, 0, width, height);
}

var slideCount = 0;
var sc = 0;
var transitionRatio = 1;

var target_sc = null;
function mouseWheel(event) {
  if (
    (!isStarted && window.scrollY == 0) ||
    (isFinished && event.delta < 0 && window.scrollY == 0)
  ) {
    startIntro();

    if (isFinished) target_sc = (slideList.length - 2) * innerHeight;
  }
  if (!target_sc && !isFinished) {
    maxsc = innerHeight * slideList.length;
    sc += event.delta;
    if (sc < 0) sc = 0;
    else if (sc > maxsc) sc = maxsc;

    if (abs(event.delta) > 10) {
      target_sc =
        (sc + innerHeight * (event.delta / abs(event.delta))) / innerHeight;
      if (sc % innerHeight > innerHeight / 2)
        target_sc = ceil(target_sc) * innerHeight;
      else target_sc = floor(target_sc) * innerHeight;
    }
    if (target_sc < 0) target_sc = 0;
  }
}

function scroll_setting() {
  slideCount = floor(sc / innerHeight);
  var off = (sc % innerHeight) / innerHeight;

  if (slideCount < slideList.length - 1) {
    if (
      slideList[slideCount].kind == "shape" &&
      slideList[slideCount + 1].kind == "shape"
    ) {
      transitionRatio = 1;
    } else if (
      slideList[slideCount].kind == "text" &&
      slideList[slideCount + 1].kind == "text"
    )
      transitionRatio = 0;
    else if (
      slideList[slideCount].kind == "text" &&
      slideList[slideCount + 1].kind == "shape"
    ) {
      transitionRatio = cos(PI - off * PI) * 0.5 + 0.5;
    } else if (
      slideList[slideCount].kind == "shape" &&
      slideList[slideCount + 1].kind == "text"
    ) {
      transitionRatio = cos(off * PI) * 0.5 + 0.5;
    }

    ratio = cos(PI - off * PI) * 0.5 + 0.5;
    gap =
      (1 - ratio) * slideList[slideCount].data.gap +
      ratio * slideList[slideCount + 1].data.gap;
    angle =
      (1 - ratio) * slideList[slideCount].data.angle +
      ratio * slideList[slideCount + 1].data.angle;
    lineRatio =
      (1 - ratio) * slideList[slideCount].data.lineRatio +
      ratio * slideList[slideCount + 1].data.lineRatio;
    faceRatio =
      (1 - ratio) * slideList[slideCount].data.faceRatio +
      ratio * slideList[slideCount + 1].data.faceRatio;
  } else {
    transitionRatio = 0;
  }
  if (slideCount >= slideList.length - 1) finishIntro();
}

var rotating = 0;
var tr = 0;
var gap = 0;
var angle = 0;
function cameraMoving() {
  shapes[0].position.x = -gap * resolutionRatio * 700;
  shapes[1].position.x = gap * resolutionRatio * 700;

  rotating = (rotating + 0.01) % (Math.PI * 2);
  shapes[0].rotation.x = rotating;
  shapes[1].rotation.x = rotating;

  shapes[0].rotation.y = gap * PI + rotating;
  shapes[1].rotation.y = gap * PI + rotating;
  cameraPos.x = cos(angle + HALF_PI) * 2200;
  cameraPos.z = sin(angle + HALF_PI) * 2200;
}

function explosion() {
  for (var i = 0; i < global_points.length; i++) {
    var force = p5.Vector.random3D();
    force.mult(random(10, 20));
    global_points[i].applyForce(force);
    global_points[i].isMoving = true;
  }
  for (var i = 0; i < global_lines.length; i++) {
    global_lines[i].run();
    global_lines[i].visible = false;
  }

  for (var i = 0; i < global_faces.length; i++) {
    global_faces[i].run();
    global_faces[i].visible = false;
  }
}

//font-family: 'Montserrat', sans-serif;
//font-family: 'Noto Sans KR', sans-serif;
var slideList;
function getTextSlideList() {
  return [
    new shapeSlide({
      gap: 0,
      angle: 0,
      lineRatio: 0,
      faceRatio: 1
    }),
    new shapeSlide({
      gap: 1,
      angle: 0,
      lineRatio: 1,
      faceRatio: 1
    }),
    new shapeSlide({
      gap: 1,
      angle: HALF_PI,
      hide: "Line",
      lineRatio: 1,
      faceRatio: 0
    }),

    new textSlide(
      [
        new SlideText("Are You LeLi ?", "Montserrat", 50, NORMAL, 0, true),
        new SlideText("To experience", "Montserrat", 30, BOLD, 81, false),
        new SlideText("New Paradime Shift", "Montserrat", 30, BOLD, 0, false),
        new SlideText(
          "레리는  새로운 패러다임의 혁신기술인 블록체인 기술을 기반으로협업,",
          "Noto Sans KR",
          15,
          NORMAL,
          30,
          false
        ),
        new SlideText(
          "신뢰에 대한 새로운 경험을 가능케하는 기술을 공급하고자 합니다.",
          "Noto Sans KR",
          15,
          NORMAL,
          9,
          false
        )
      ],
      "ver",
      { gap: 1, angle: HALF_PI, hide: "Line", lineRatio: 1, faceRatio: 0 }
    ),

    new shapeSlide({
      gap: 1,
      angle: -HALF_PI,
      hide: "Face",
      lineRatio: 0,
      faceRatio: 1
    }),

    new textSlide(
      [
        new SlideText("We Are LeLi !", "Montserrat", 50, NORMAL, 0, true),
        new SlideText(
          "To build Human-Centered",
          "Montserrat",
          30,
          BOLD,
          81,
          false
        ),
        new SlideText(" Smart City", "Montserrat", 30, BOLD, 0, false),
        new SlideText(
          "레리는 사람들이 거주하는 도시, 건축의 환경이  사람들의 삶을 우선시 하는 환경으로 거듭나고,",
          "Noto Sans KR",
          15,
          NORMAL,
          30,
          false
        ),
        new SlideText(
          "삶의 질 향상과 문화수준이 높아지는 데에 기여하고자 합니다.",
          "Noto Sans KR",
          15,
          NORMAL,
          9,
          false
        )
      ],
      "ver",
      { gap: 1, angle: -HALF_PI, hide: "Face", lineRatio: 0, faceRatio: 1 }
    ),

    new shapeSlide({
      gap: 1,
      angle: 0,
      lineRatio: 1,
      faceRatio: 1
    }),

    new textSlide(
      [
        new SlideText("Are You LeLi ?", "Montserrat", 50, NORMAL, 0, true),
        new SlideText("We Are LeLi !", "Montserrat", 50, NORMAL, 276, true)
      ],
      "hor",
      { gap: 1, angle: 0, lineRatio: 1, faceRatio: 1 }
    ),

    new shapeSlide({
      gap: 0,
      angle: 0,
      lineRatio: 0,
      faceRatio: 1
    }),

    new textSlide(
      [
        new SlideText(
          "블록체인이 가지고 있는 철학과 기술에 대한 이해를 바탕으로",
          "Montserrat",
          30,
          BOLD,
          0,
          true
        ),
        new SlideText(
          "레리 주식회사는 실현가능한 구체적인 솔루션을 제시합니다.",
          "Montserrat",
          30,
          BOLD,
          39,
          true
        )
      ],
      "ver",
      { gap: 2, angle: 0, lineRatio: 0, faceRatio: 1 }
    )
  ];
}

function drawText(slide) {
  colorMask.clear();
  colorMask.fill(255);
  colorMask.textAlign(CENTER, CENTER);

  whiteMask.clear();
  whiteMask.fill(255);
  whiteMask.textAlign(CENTER, CENTER);

  if (slide.type == "ver") {
    var h = 0;
    for (var i = 0; i < slide.list.length; i++) {
      h += slide.list[i].font_size;
      h += slide.list[i].margin;
    }

    var y = -h / 2;

    for (var i = 0; i < slide.list.length; i++) {
      var textCV = slide.list[i].isColor ? colorMask : whiteMask;
      y += slide.list[i].margin;

      textCV.textFont(slide.list[i].font_family);
      textCV.textStyle(slide.list[i].font_weight);
      textCV.textSize(slide.list[i].font_size);
      textCV.text(slide.list[i].text, width / 2, height / 2 + y);
      y += slide.list[i].font_size;
    }
  } else {
    var m = 0;
    var m = 0;
    for (var i = 0; i < slide.list.length; i++) {
      var textCV = slide.list[i].isColor ? colorMask : whiteMask;
      textCV.textSize(slide.list[i].font_size);
      m += textCV.textWidth(slide.list[i].text) / 2;
      m += slide.list[i].margin;
    }

    var x = -m / 2;

    for (var i = 0; i < slide.list.length; i++) {
      var textCV = slide.list[i].isColor ? colorMask : whiteMask;
      textCV.textFont(slide.list[i].font_family);
      textCV.textStyle(slide.list[i].font_weight);
      textCV.textSize(slide.list[i].font_size);
      textCV.text(slide.list[i].text, width / 2 + x, height / 2);
      x += m;
    }
  }
}

//font-family: 'Montserrat', sans-serif;
//font-family: 'Noto Sans KR', sans-serif;

function SlideText(text, font_family, font_size, font_weight, margin, isColor) {
  this.text = text;
  this.font_family = font_family;
  this.font_size = font_size;
  this.font_weight = font_weight;
  this.margin = margin;
  this.isColor = isColor;
}

function textSlide(list, type, data) {
  this.kind = "text";
  this.type = type;
  this.list = list;
  this.data = data;
}

function shapeSlide(data, type) {
  this.kind = "shape";
  this.data = data;
}
