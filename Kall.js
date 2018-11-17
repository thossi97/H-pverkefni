function Kall(descr) {

    // Common inherited setup logic from Entity
    this.setup(descr);
    //upphafsstaða og upphafshraði
    this.x = 200;
    this.y = 400;
    this.defVelX=5;
    this.velX=this.defVelX;
    this.velY=0;

    //hæð og breidd
    this.width = 170;
    this.height = 85;

    // Hæð og breidd á jump-spriteinum
    //this.jumpWidth = g_jumpSprite[0].width;
    //this.jumpHeight = g_jumpSprite[0].height;

    // Hæð og breidd á dash-spriteinum
    //this.dashWidth = g_dashSprite[0].width;
    //this.dashHeight = g_dashSprite[0].height;

    //þyngdarafl og hoppkraftur
    this.gravity = 0.5;
    this.jumpForce =- 15;
    //boolean breita sem er true þegar hann er í loftinu en false annars
    this.inAir = true;
    //jumpcounter telur hoppin niður
    this.jumpCounter = 2;
    //frameCounter er fyrir rammana í sprite animation
    this.framecounter = 0;
    this.Jumpframecounter = 0;
    this.Dashframecounter = 0;

    //hraði á kall
    this.isThrowing = false;

    //should explode when colliding with left edge of platform
    //and when colliding with gem entity
    this.isExploding = false;

    //dashing, extra speed
    this.isDashing = false;
    //number of frames we want to be dashing
    this.dashCounter = 20;

    // Líf
    this.lives = 3;
    this.heartSize = 50;

    // Score
    this.score = 0;
    this.scoreSpeed = 2.5;

    // Highscore
    this.highscore = [];
    this.nrOfTries = 0;

    this.type =  "Kall";

    //collision helper with shineCollide
    this.hasShineCombo = false;
    this.combo = 0;
};

Kall.prototype = new Entity();


Kall.prototype.KEY_JUMP= 'W'.charCodeAt(0);
Kall.prototype.KEY_DASH= 'D'.charCodeAt(0); //fast speed forward, dashing
Kall.prototype.RESET= 'U'.charCodeAt(0);

Kall.prototype.update = function(du){

    spatialManager.unregister(this);

    this.comboLifeSpan -= du;
    if (this.lifeSpan < 0) return entityManager.KILL_ME_NOW;

    //console.log(this.framecounter);
    //console.log(this.Jumpframecounter);
    //console.log(this.Dashframecounter);

    //set the xVel of the unicorn based on if
    //it is dashing or not
    this.setSpeed(du);
    this.defVelX+=0.003*du;
    //console.log(this.defVelX);
    if(this.inAir){
      this.Jumpframecounter+=0.378;
      if (this.Jumpframecounter>=26) {
        this.Jumpframecounter=31.1;
      }
    }
    else {
      this.framecounter+=1;
      this.framecounter%=25;
    }

    // if the unicorn is done exploding then kill it
    if (explode.done(g_explosionSprite.length)) {
      this.loseLife();
      this.kill();
    }

    // Check for hit entity, if its hit it checks wwhich side it is on and acts accordingly,
    // resets or is on the platform.
    this.handleKeys(du);
    this.applyAccel(0,this.gravity,du);
    this.collidesWith(du);

     //check if out of canvas
    if (this.y > g_canvas.height) {
      this.loseLife();
    }

    // Check for death
    if(this._isDeadNow){
      if (this.nrOfTries < 2) {
        this.highscore[this.nrOfTries] = this.score;
      }
      this.nrOfTries++;
      console.log(this.highscore);
      return entityManager.KILL_ME_NOW
    }
    //else register
    else
      spatialManager.register(this);

   

    // Update the score
    this.score += Math.floor(this.scoreSpeed*du);
    //console.log(this.score);
};

Kall.prototype.setSpeed = function(du) {
  //is the unicorn dashing and is the dashcounter not zero?
    if (this.isDashing && this.dashCounter !== 0) { 
      this.dashCounter--;         //dash for only 15 frames
      this.applyAccel(1,0,du) ;   //set velocity to more speed
      this.jumpCounter=1;         //unicorn can jump once after it has dashed
      this.velY=0;                // no vertical velocity while dashing
      this.Dashframecounter+=1;
      if (this.Dashframecounter>11) {
        this.Dashframecounter=11.1;
        this.Jumpframecounter=6;
      }
    //unicorn is not dashing anymore move as usual
    } else {
      this.isDashing = false;     //not dashing
      this.velX=this.defVelX;     //set velocity to normal speed
      this.dashCounter = 15;      //reset the dashCounter to 15 again
    }
};

Kall.prototype.collidesWith = function(du){

    if (spatialManager.isHit(this.x+65, this.y+30,
      this.width-125, this.height-40).length != 0){              //þessar tölur fengum við út með því að prófa okkur áfram í render á spatial manager
        var ent = spatialManager.isHit(this.x+65, this.y+30,     //Þær gera collideboxið hjá einhyrningnum minna, munu koma 2-3 fyrir aftur í platformcollide
          this.width-125, this.height-40);                    

        for(i=0 ; i < ent.length; i++){
          if(ent[i].getType() === "Gem"){                //collision with the gem
            this.gemCollide(ent[i]);
          } else if (ent[i].getType() === "Platform"){    //collision with the platform
            this.platformCollide(ent[i]);
          } else if (ent[i].getType() === "Shine") {    //collision with shine
            this.shineCollide(ent[i]);
          }
        }
    } else {
        this.inAir=true;
    }
};


Kall.prototype.gemCollide = function(gem){
    //if we dash into the gem the gem explodes
    if (this.isDashing) {
      gem.explodes();
    //else the unicorn loses a life
    } else  {
      this.loseLife();
    }
};

Kall.prototype.platformCollide = function(entity){
    //where are we colliding with platform?
    var posX = entity.getPos().posX+20;         //Ég breytti platform collide boxinu
    var posY = entity.getPos().posY*1.035;      //til þess að þetta looki meira smooth
    var eWidth = entity.getWidth()-30;          //Breytti því líka þegar X er togglað
    var eHeight = entity.getHeight()*0.6;
    var x = this.x+65;
    var y = this.y+30;
    var w = this.width-125;
    var h = this.height-40;

    //LEFT EDGE - character should explode and lose a life
    if (x < posX  &&  y+h >= posY+12)  //Gerði y coord til að collisionið sé
    /*&& this.x+this.width-5 < entity.getPos().posX)*/                            //meira forgiving utaf collisionið er stundum ekkert
    {                                                                             // alltor nakvæmt miðað við platforms
      //this.isExploding = true;
      while (Math.floor(x+w) > posX) {
        this.x--;
        x=this.x+70;
      }
      //this.x -=5
      this.isExploding = true; 
      //this.loseLife();
      return;
    }

    //TOP EDGE - character should run on platform
    else if (y < posY)
    {
        //make sure to drag it out of the ground if it
        //went to far on the last frame
        while(Math.floor(y+h) > posY+eHeight)
        {
          this.y--;
          var y=this.y+30;
        }
        this.y = posY-this.height-(30-40);   //y and height difference
        this.velY=0;
        this.jumpCounter=2;
        this.inAir=false;
    }

    //BOTTOM EDGE - character should stop rising and start falling
    else if (y+h >
        posY + eHeight)
    {

        //make sure to drag it out of the ground if it
        //went to far on the last frame
        while(Math.floor(y) < posY+eHeight)
        {
          this.y++;
          var y=this.y+30;
        }
        this.velY*=-0.5;
        // TODO ÞEGAR AÐ DASH ER KOMIÐ ÞARF AÐ SKODÐA ÞETTA BETUR
        // ERFITT AÐ EIGA VIÐ BOTNINN NÚNA.
    }
};

Kall.prototype.shineCollide = function (shine) {

  //TODO LAGA ÞETTA ÞANNIG AÐ COMBO DETTI ÚT.

      //console.log(this.hasShineCombo);
      this.hasShineCombo = true;
     // console.log(this.score);
      shine.kill();
      if (this.hasShineCombo) {
        this.combo++;
        this.score += this.combo*10;
      } else {
        this.score += 10;
      }
};

Kall.prototype.drawCombo = function (ctx, xPos, yPos) {

    ctx.font = "bold 40px Consolas";
    ctx.textAlign = "center";

    // Color of the combo text
    ctx.fillStyle = "white";

    // Color of the shadow
    ctx.shadowColor = '#1c5e66';
    ctx.shadowBlur = 40;

    // Draw the combo text
    ctx.fillText("10", xPos, yPos);

    ctx.fill();

    // Make sure the shadow is only applied to the combo
    ctx.shadowBlur = 0;
};

Kall.prototype.loseLife = function () {
      //----\\
     // TODO \\
    //--------\\
    /*
    *Gera reset function sem resettar mappið ofl.
    */
    this.lives--;


    if (this.lives === 0) {
        this.kill();
        main.gameOver();
      // TODO
      // Play game over sound
    }

    else {
      entityManager.reset();
      this.defVelX=5;
      this.y =200;
      this.x =500;
    }

};


Kall.prototype.handleKeys = function(du){

    if (eatKey(this.KEY_JUMP)) {
      if (this.jumpCounter!==0) {
        this.Jumpframecounter=0;
        this.velY=0;
        this.jumpCounter-=1;
        this.inAir=true;
        this.applyAccel(0,this.jumpForce, du);
      }
    }
    if (eatKey(this.RESET)||this.y>g_canvas.height) {
      this.x=200;
      this.y=400;
      this.velY=0;
    }
    if (eatKey(this.KEY_DASH)) {
      this.isDashing = true;      //more speed access
      this.Dashframecounter=0;
    }
};


Kall.prototype.applyAccel= function(accelX,accelY,du){
  // u=original velocity

  var oldVelY= this.velY;
  var oldVelX= this.velX;
  //v = u + at

  this.velY += accelY * du;
  this.velX += accelX * du;
  // v_ave = (u + v) / 2

  var aveVelY = (oldVelY + this.velY) / 2;
  var aveVelX = (oldVelX + this.velX) / 2;
  // s = s + v_ave * t

  this.y += aveVelY*du;
  this.x += aveVelX*du;
};

Kall.prototype.getNextY = function(accelY,du){
  // u=original velocity
  var oldVelY= this.velY;
  //v = u + at
  this.velY += accelY * du;

  // v_ave = (u + v) / 2
  var aveVelY = (oldVelY + this.velY) / 2;

  // s = s + v_ave * t
  var nextY = this.y + aveVelY * du;

  return nextY;
};


// Draw the hearts on the screen.
Kall.prototype.drawLives = function(ctx) {
  // Space between the hearts
  var livesOffset = 55;

  // TODO "dauðu" teiknast núna undir hinum, hægt að gera betur?
  for (var i = 0; i < 3; i++) {
    g_sprites.dead.drawAtAndEnlarge(ctx, camera.getPos().posX+15 + livesOffset * i,
                                      camera.getPos().posY+20, this.heartSize, this.heartSize);

  }

  // Draw as many hearts as lives the player has left
  for (var i = 0; i < this.lives; i++) {
    g_sprites.alive.drawAtAndEnlarge(ctx, camera.getPos().posX+15 + livesOffset * i,
                                      camera.getPos().posY+20, this.heartSize, this.heartSize);

  }

  //onsole.log(this.lives);
  //console.log();

};

Kall.prototype.drawScore = function(ctx) {

  ctx.font = "bold 40px Consolas";
  ctx.textAlign = "center";

  // Color of the score
  ctx.fillStyle = "white";

  // Color of the shadow
  ctx.shadowColor = '#1c5e66';
  ctx.shadowBlur = 40;

  // Draw the score if the game is not over
  if (!main._isGameOver) {
    ctx.fillText(this.score, g_canvas.width / 2 + camera.getPos().posX - 20,
                            70 + camera.getPos().posY);
  } else if (main._isGameOver) {
    // VIRKAR EKKI, IMPLEMENTA Á ANNAN HÁTT
    ctx.fillText("You got " + this.score + "points", g_canvas.width / 2 - 20, 70);
  }

  ctx.fill();

  // Make sure the shadow is only applied to the score
  ctx.shadowBlur = 0;
};
Kall.prototype.reset = function(){
  this.x=200;
  this.y=400;
}


Kall.prototype.render = function(ctx){

  if (main._isGameOver) return;
  else if (this.isDashing) {
    g_dashSprite[Math.floor(this.Dashframecounter)].drawAtAndEnlarge(ctx,this.x-150,this.y,this.width+150,this.height);
  } else if (this.inAir) {
    g_jumpSprite[Math.floor(this.Jumpframecounter)].drawAtAndEnlarge(ctx,this.x,this.y,this.width-20,this.height+20);
  }
  else if (this.isExploding) {
   // this increases the framecount for the explosion animation
   explode.frames();
   // this draws the explosion
   explode.draw(ctx,this.x,this.y,this.width,this.height,g_explosionSprite);
  }
  else {
    g_runSprite[Math.floor(this.framecounter)].drawAtAndEnlarge(ctx,this.x,this.y,this.width,this.height);
  }
  this.drawLives(ctx);
  this.drawScore(ctx);
};

/*
Kall.prototype.render = function(ctx){

  if (main._isGameOver) return;

  if (this.isThrowing) {
    g_throwSprite[Math.floor(this.framecounter)].drawAtAndEnlarge(ctx,this.x,this.y,this.width,this.height);
  } else if (this.inAir && this.isDashing) {
    g_dashSprite[Math.floor(this.framecounter)].drawAtAndEnlarge(ctx,this.x - this.width,this.y,this.dashWidth,this.dashHeight);
 } else if (this.inAir) {
    g_jumpSprite[Math.floor(this.framecounter)].drawAtAndEnlarge(ctx,this.x,this.y,this.jumpWidth,this.jumpHeight);
  }
  
  TODO LÁTA ÞETTA VIRKA
  else if (this.isExploding) {
    g_explosionSprite[Math.floor(this.frameCounter)].drawAtAndEnlarge(ctx,this.x,this.y,this.width,this.height);
  }
  
  else {
    g_runSprite[Math.floor(this.framecounter)].drawAtAndEnlarge(ctx,this.x,this.y,this.width,this.height);
  }

  var fadeThresh = this.comboLifeSpan / 3;

  if (this.comboLifeSpan < fadeThresh) {
      ctx.globalAlpha = this.comboLifeSpan / fadeThresh;
  }

  ctx.globalAlpha = 1;

  this.drawLives(ctx);
  this.drawScore(ctx);
  if (this.hasShineCombo) {
    this.drawCombo(ctx, this.x, this.y);
  }
};
*/
