package {
    import flash.geom.*;
    import flash.text.*;
    import flash.events.*;
    import flash.display.*;
    import flash.ui.Keyboard;
    import org.si.cml.*;
    import org.si.cml.extensions.*;

    
    // simplest sample of whole shmups with BulletRunner
    [SWF(width="300", height="400", frameRate="20")]
    public class BulletRunnerSample extends Sprite {
        // root object
        private var _root:Sprite;
        // player object
        private var _player:Player;
        // frame counter
        private var _frameCount:int;
        // miss count
        private var _missCount:int;
        // score
        private var _score:int;
        // score board
        private var tf:TextField;
        
        
        // root CML (stage sequence)
        // This CML statement creates new enemy every 60frames, and increment rank by 0.1 for every 4 enemies.
        // "py-200"    : set y position of root as -200
        // "["         : start loops
        // "px$??*120" : set x position of root as "(rand()*2-1)*120". the "$??" returns (rand()*2-1).
        // "n{10}"     : "n" command with sequence parameter of "10". this command calls onRootNew()
        // "w40-$r*20" : wait (40-rank*20) frames. "$r" refers CMLObject.rank.
        // "]4"        : end loop with 4 times repeating.
        // "l$r+=0.1"  : increment rank by 0.1. "l"(let) command executes calculation.
        // "]"         : end loop with repeating infinitely.
        private var rootCML:String = "py-200[[px$??*120n{10}w40-$r*20]4l$r+=0.1]"
        
        
        function BulletRunnerSample() {
            addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
        }
        
        
        private function onAddedToStage(e:Event) : void {
            removeEventListener(Event.ADDED_TO_STAGE, onAddedToStage);

            // create score board
            tf = new TextField();
            tf.autoSize = "left";
            addChild(tf);
            
            // draw field graphics and add field
            Bullet.field.x = 150;
            Bullet.field.y = 200;
            Bullet.field.graphics.lineStyle(2,0);
            Bullet.field.graphics.drawRect(-150, -200, 300, 400);
            addChild(Bullet.field);
            
            // set scope limit of all bullet, 
            // callback function of BulletRunner "onDestroy" is called when the object escapes from the scope.
            BulletRunner.setDefaultScope(-150, -200, 300, 400);
            
            // usually, create root object (invisible) first of all.
            _root = new Sprite();
            // apply BulletRunner to root object
            var br:BulletRunner = BulletRunner.apply(_root);
            // set callback functions
            br.callbacks = {"onNew":onRootNew};
            // run CML sequence with root object.
            br.runSequence(rootCML);
            
            // create player object and add to field
            _player = new Player();
            Bullet.field.addChild(_player);

            // initialize variables
            _missCount = 0;
            _score = 0;
            updateTextField();
            
            // enter frame event
            addEventListener(Event.ENTER_FRAME, onEnterFrame);
            stage.addEventListener(KeyboardEvent.KEY_DOWN, onKeyDown);
            stage.addEventListener(KeyboardEvent.KEY_UP,   onKeyUp);
        }
        
        
        // callback by "n" command of root object
        public function onRootNew(args:Array) : BulletRunner
        {
            return Bullet.createNewBullet(args, true);
        }

        
        // enter frame event handler
        public function onEnterFrame(e:Event) : void
        {
            var i:int, j:int, imax:int, jmax:int, bullet:Bullet, shot:Shot;
            
            _frameCount++;
            
            // update target position
            _player.x += _player.vx;
            _player.y += _player.vy;
            BulletRunner.updateTargetPosition(_player.x, _player.y);
            
            // create shot
            if (_player.shooting && (_frameCount&1)) {
                shot = new Shot();
                shot.x = _player.x;
                shot.y = _player.y - 6;
                Bullet.field.addChild(shot);
            }
            
            // hit check between shots and enemies
            imax = Shot.instances.length;
            jmax = Bullet.enemies.length;
            for (j=0; j<jmax; j++) {
                bullet = Bullet.enemies[j];
                for (i=0; i<imax; i++) {
                    shot = Shot.instances[i];
                    if (shot.hitTestObject(bullet)) {
                        bullet.damage(0.2);
                        shot.destroy();
                        _score++;
                        updateTextField();
                        i--;
                        imax--;
                        break;
                    }
                }
            }
            
            // hit check between bullets and player
            if (_player.ignoreHit > 0) {
                _player.ignoreHit--;
                _player.alpha = _frameCount & 1;
            } else {
                _player.alpha = 1;
                imax = Bullet.instances.length;
                for (i=0; i<imax; i++) {
                    bullet = Bullet.instances[i];
                    if (bullet.hitTestObject(_player)) {
                        bullet.disappear();
                        miss();
                    }
                }
            }
        }
        
        
        // missed
        public function miss() : void
        {
            _missCount++;
            _player.ignoreHit = 20;
            updateTextField();
        }
        
        
        // update text field
        public function updateTextField() : void
        {
            // you can access rank value by CMLObject.globalRank
            tf.text = "SCORE : " + _score.toString() + " / MISS : " + _missCount.toString() + " / RANK : " + CMLObject.globalRank.toString();
        }
        
        
        // key down event handler
        public function onKeyDown(e:KeyboardEvent) : void 
        {
            switch (e.keyCode) {
            case Keyboard.UP:
                _player.vy = -10;
                break;
            case Keyboard.DOWN:
                _player.vy = 10;
                break;
            case Keyboard.LEFT:
                _player.vx = -10;
                break;
            case Keyboard.RIGHT:
                _player.vx = 10;
                break;
            case Keyboard.SPACE:
                _player.shooting = true;
                break;
            }
        }
        
        
        // key up event handler
        public function onKeyUp(e:KeyboardEvent) : void 
        {
            switch (e.keyCode) {
            case Keyboard.UP:
            case Keyboard.DOWN:
                _player.vy = 0;
                break;
            case Keyboard.LEFT:
            case Keyboard.RIGHT:
                _player.vx = 0;
                break;
            case Keyboard.SPACE:
                _player.shooting = false;
                break;
            }
        }
    }
}




import org.si.cml.*;
import org.si.cml.extensions.*;
import flash.display.*;
import flash.events.*;

// bullet class
class Bullet extends Shape {
    // field
    static public var field:Sprite = new Sprite();
    
    // all instances in the field (shortcut of field.ChildAt())
    static public var instances:Array = [];
    
    // all enemy instances in the field
    static public var enemies:Array = [];

    // sequence of enemy
    static public var sequences:Array = [
        new CMLSequence("v0,10i20v~bm5,120   [f4+$r*4{6}w20]3ay0.3"),         // 5 way barrage, repeat 3 times
        new CMLSequence("v0,10i20v~bm5,0,2   [f7-$r*3{5}w20]3ay0.3"),         // 5 straight bullets, repeat 3 times
        new CMLSequence("v0,10i20v~bm5,0,0,2 [f8+$r*6{3}w20]3 ay0.3"),        // 5 rapid-fire cannon, repeat 3 times
        new CMLSequence("v0,10i20v~bm8,15,4,2htx[f7+$r*3{4}w30]2ay0.3"),      // 5 "whip" type barrage, repeat 2 times
        new CMLSequence("v0,10i20v~br5,30,2,4[f8+$r*6{4}w30]2ay0.3"),         // 5 random bullets, repeat 2 times
        new CMLSequence("v0,10i20v~bm12,360  [f8{6i10v~vd6+$r*8}w30]2ay0.3"), // 12 round barrage, repeat 2 times
        new CMLSequence("v0,10i20v~bm24,360,0,1bm2,180 f4+$r*8{3}w60 ay0.3")  // doubled all range barrage
    ];
    
    // bullet runner of this bullet
    private var _bulletRunner:BulletRunner;
    
    // create as first bullet that runs sequence
    private var _createdAsEnemy:Boolean;
    
    // life of this bullet
    private var _life:Number;
    
    
    function Bullet(radius:int, createAsEnemy:Boolean) {
        super();
        
        // draw bullet graphics
        graphics.lineStyle(2, 0x404040);
        graphics.beginFill(0xc0c0c0);
        graphics.drawCircle(0, 0, radius);
        graphics.endFill();

        // create as enemy
        _createdAsEnemy = createAsEnemy;
    }
    
    
    // disappear
    public function disappear() : void {
        // set destruction flag.
        // the system calls "onDestroy" if the destuction flag is set
        _bulletRunner.destroy(0);
    }
    
    // damage and destroy this bullet
    public function damage(d:Number) : void {
        _life -= d;
        if (_life <= 0) {
            // set destruction flag.
            // the system calls "onDestroy" if the destuction flag is set
            _bulletRunner.destroy(1);
        }
    }
    
    // call back when the object appears on the CML stage
    public function onCreate(br:BulletRunner) : void {
        // get bullet runner of this instance
        _bulletRunner = br;
        // add to the field when the object appears on the CML stage
        field.addChild(this);
        instances.push(this);
        // run random sequence when this object is created as first bullet
        if (_createdAsEnemy) {
            var seqIndex:int = int(Math.random() * sequences.length);
            br.runSequence(sequences[seqIndex]);
            enemies.push(this);
            _life = 1;
        }
    }

    // call back in each frame
    public function onUpdate(br:BulletRunner) : void {
    }

    // call back when the object escapes from the CML stage or BulletRunner.destroy() is called.
    public function onDestroy(br:BulletRunner) : void {
        var exp:Exprosion;
        // destructionStatus is a reference for the argument of CMLObject.destroy()
        switch (br.destructionStatus) {
        case 0: // ussualy escape from stage
            break;
        case 1:
            exp = new Exprosion();
            exp.x = x;
            exp.y = y;
            field.addChild(exp);
            break;
        }
        
        // remove instance
        if (_createdAsEnemy) enemies.splice(enemies.indexOf(this), 1);
        instances.splice(instances.indexOf(this), 1);
        field.removeChild(this);
    }
    
    // call back when new object is requested by 'n' command.
    public function onNew(args:Array) : BulletRunner {
        return createNewBullet(args, false);
    }
    
    // call back when new object is requested by 'f' command.
    public function onFire(args:Array) : BulletRunner {
        return createNewBullet(args, false);
    }
    
    // create new bullet 
    static public function createNewBullet(args:Array, createAsEnemy:Boolean) : BulletRunner {
        // your own instance, "args" refers the arguments of sequence
        var newBullet:Bullet = new Bullet(args[0], createAsEnemy);
        // create new bullet runner that has your own instance
        var br:BulletRunner = BulletRunner.apply(newBullet);
        br.callbacks = newBullet;
        return br;
    }
}


// exprosion
class Exprosion extends Shape {
    function Exprosion() {
        graphics.lineStyle(2, 0x404040);
        graphics.drawCircle(0, 0, 10);
        graphics.endFill();        
        addEventListener(Event.ENTER_FRAME, onEnterFrame);
        scaleX = scaleY = 0;
        alpha = 1;
    }
    
    public function onEnterFrame(e:Event) : void {
        alpha -= 0.1;
        scaleX += alpha*0.5;
        scaleY = scaleX;
        if (alpha < 0) {
            parent.removeChild(this);
            removeEventListener(Event.ENTER_FRAME, onEnterFrame);
        }
    }
}



// player class
class Player extends Shape {
    // velocity
    public var vx:Number, vy:Number, shooting:Boolean, ignoreHit:int;
    
    function Player() {
        graphics.beginFill(0x606060);
        graphics.drawPath(Vector.<int>([1,2,2]),Vector.<Number>([0,-6,-6,4,6,4]));
        graphics.endFill();
    }
}



// player's shot class
class Shot extends Shape {
    // velocity
    public var vy:Number;
    
    // all instances in the field (shortcut of field.ChildAt())
    static public var instances:Array = [];
    
    function Shot() {
        super();
        graphics.beginFill(0xc0c0c0);
        graphics.drawRect(-3, -6, 2, 12);
        graphics.drawRect( 1, -6, 2, 12);
        graphics.endFill();
        instances.push(this);
        addEventListener(Event.ENTER_FRAME, onEnterFrame);
        vy = -20;
    }
    
    public function onEnterFrame(e:Event) : void {
        y += vy;
        if (y < -200) destroy();
    }
    
    public function destroy() : void {
        parent.removeChild(this);
        removeEventListener(Event.ENTER_FRAME, onEnterFrame);
        instances.splice(instances.indexOf(this), 1);
    }
}


