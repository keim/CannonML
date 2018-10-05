package {
    import flash.events.*;
    import flash.display.*;
    import org.si.cml.*;
    
    
    // Simple example for the usage of cannonML
    //--------------------------------------------------
    public class CMLObjectSample extends Sprite {
    //-------------------------------------------------- stage CML 
        // CML は 砲台の動作を表現します．
        // CML text represents cannon behaviour
        public var stageCML:String = "py-160[px$??*100n{{[rw]}vy$?*10+2i40v~bm$i?(5)+2,45f5vd-10}w30]";
        
        
        
        
    //-------------------------------------------------- constructor
        function CMLObjectSample()
        {
            addEventListener(Event.ADDED_TO_STAGE, _setup);
        }
        
        
        
        
    //-------------------------------------------------- setup
        private function _setup(e:Event) : void
        {
            removeEventListener(Event.ADDED_TO_STAGE, _setup);
            
            // draw field
            field = new Sprite();
            field.x = 120;
            field.y = 160;
            field.graphics.lineStyle(1, 0);
            field.graphics.drawRect(-120, -160, 240, 320);
            addChild(field);
            
            
            // (1)
            // 初期化のために CMLObject.initialize() を最初に呼び出します．
            // call CMLObject.initialize() as first setup
            CMLObject.initialize(true);
            
            
            // (2)
            // CMLSequence は，砲台の挙動を表現します
            // cannonML 文字列 か bulletML XML をコンストラクタに渡してください．
            // CMLSequence represents sequence of cannon behaiviors.
            // pass cannonML text or bulletML xml to the constructor.
            var stageSequence:CMLSequence = new CMLSequence(stageCML);

            
            // (3)
            // ステージシーケンスを実行するための stageCannon を生成します
            // create stageCannon to execute stage sequence
            var stageCannon:Cannon = new Cannon(0);
            
            
            // (4)
            // CMLObject.create() は CMLObject を CML ステージ上に生成します．
            // 引数で，x, y 座標値を指定します．
            // CMLObject.create() creates CMLObject in the CML stage.
            // the arguments specify x and y coordinate.
            stageCannon.create(0, -160);
            
            
            // (5)            
            // CMLObject.execute() は CMLSequence を CMLObject に実行させます．
            // また，この関数は CMLFiber (thread に相当) を返値としてかえします．
            // CMLFiber を用いて，実行状態をコントロールしたり，様々な値にアクセスしたりできます． 
            // CMLObject.execute() executes CMLSequence with CMLObject.
            // And it returns CMLFiber that represents thread executor.
            // you can control execution and access any parameters by CMLFiber.
            var stageFiber:CMLFiber = stageCannon.execute(stageSequence);
            
            
            // frame handler
            addEventListener(Event.ENTER_FRAME, _draw);
        }
        
        
    //-------------------------------------------------- ENTER_FRAME event handler
        private function _draw(e:Event) : void
        {
            // (6)
            // CMLObject.update() を各フレームで呼び出します．
            // call CMLObject.update() in each frames
            CMLObject.update();
        }
    }
}




import flash.display.*;
import org.si.cml.*;


// cannons field
var field:Sprite;




// (0)
// CMLObject の継承クラスで，5個のコールバック関数をオーバーライドします．
// Define class extension of CMLObject, and override 5 callback functions.
class Cannon extends CMLObject {
    // constructor
    function Cannon(radius:Number) 
    {
        createNewCannonShape(radius);
    }
    
    
    // onCreate は，このオブジェクトが CML ステージ上に生成されたときに呼び出されます．
    // CMLObject.create() か，"n/f" CMLコマンド実行時に内部から呼び出されます．
    // "n/f" CMLコマンド時は，onNewObject/onFireObject で返した CMLObject の create() が内部で呼び出されています．
    // onCreate is called when this object is created.
    // This function is called from system when CMLObject.create() or "n" or "f" command in CML.
    // When called from "n" or "f" command, the system calls create() of CMLObject that is returned from onNewObject/onFireObject.
    override public function onCreate() : void
    {
        // フィールドに cannonShape を追加
        // add cannonShape to the field
        field.addChild(cannonShape);
        
        // cannonShape の位置と回転方向を更新
        // update position and angle of cannonShape
        cannonShape.x = this.x;
        cannonShape.y = this.y;
        cannonShape.rotation = this.angle;
    }
    
    
    // onDestroy は，このオブジェクトが CML ステージ上から消えたときに呼び出されます．
    // この関数は，CMLObject.destroy() が呼ばれた際に呼び出されます．
    // より正確には，CMLObject.destroy() により破壊フラグがセットされ，
    // 全てのオブジェクトの update が終了後，破壊フラグがチェックされて，その際に onDestroy が呼び出されます．
    // onDestroy is called when this object is destroyed (or escaped)
    // This function is called from system when CMLObject.destroy().
    // To be exact, the CMLObject.destroy() sets destruction flag, 
    // and after all updates, flags are checked and system calls all onDestroys.
    override public function onDestroy() : void
    {
        // CMLObject.destructionStatus で destory() 呼び出しの際に引数で指定した値を参照できます．
        // CMLObject.destructionStatus refers the number that is specifyed by your CMLObject.destory() call.
        if (this.destructionStatus == 1) {
            // 通常，destructionStatus == 0 でステージから逃避，1 でプレイヤーによる破壊を示します．
            // Usually，destructionStatus == 0 means escape from stage, and 1 means destruction by player.
            createExplosion();
        }
        field.removeChild(cannonShape);
    }
    
    
    // onUpdate は，各 CMLObject.update() 呼び出し時に呼び出されます．
    // onUpdate is called in each CMLObject.update().
    override public function onUpdate() : void
    {
        // cannonShape の位置と回転方向を更新
        // CMLObject の x, y, angle プロパティは，そのCMLObjectの現在の座標と回転方向です．
        // update position and angle of cannonShape
        // the properties of CMLObject "x", "y"and "angle" represents coordinate and rotation.
        cannonShape.x = this.x;
        cannonShape.y = this.y;
        cannonShape.rotation = this.angle;
        
        // ステージからいなくなったら，destructionStatus = 0 で destroy() 呼び出し
        // destroy() with destructionStatus of 0, when the object escape from the stage
        if (this.x<-140 || this.x>140 || this.y<-180 || this.y>180) this.destroy(0);
    }
    
    
    // onNewObject は，"n" CMLコマンド実行時に呼び出されます．新たな CMLObject を返す必要があります．
    // 返した新たな CMLObject は，適切な初期化を施され内部で create()/(必要なら)execute() されます．
    // onNewObject is called by "n" command in CML, and it should return new CMLObject.
    // The returned CMLObject is initialized and system calls create() and execute()(if necessary).
    override public function onNewObject(args:Array) : CMLObject
    {
        // return new Cannon
        return new Cannon(8);
    }
    
    
    // onFireObject は，"f" CMLコマンド実行時に呼び出されます．新たな CMLObject を返す必要があります．
    // 返した新たな CMLObject は，適切な初期化を施され，内部で create()/(必要なら)execute() されます．
    // onFireObject is called by "f" command in CML, and it should return new CMLObject.
    // The returned CMLObject is initialized and system calls create() and execute()(if necessary).
    override public function onFireObject(args:Array) : CMLObject
    {
        // return new Cannon
        return new Cannon(4);
    }
    
    
    // shape
    private var cannonShape:Shape;
    
    
    // create new cannon shape
    private function createNewCannonShape(radius:Number) : void
    {
        var graphics:Graphics;
        cannonShape = new Shape();
        graphics = cannonShape.graphics;
        if (radius > 0) {
            graphics.lineStyle(2, 0x404080);
            if (radius > 6) {
                graphics.moveTo(0, 0);
                graphics.lineTo(radius+4, 0);
            }
            graphics.beginFill(0xc0c0f0);
            graphics.drawCircle(0, 0, radius);
            graphics.endFill();
        }
    }
    
    
    // create explosion
    private function createExplosion() : void
    {
    }
}

