package {
    import flash.geom.*;
    import flash.events.*;
    import flash.display.*;
    import org.si.cml.*;
    import frocessing.color.FColor;

    // cannonML particle test
    public class FirstSample extends Sprite {
        
        // cannonML script
        private var script:String = "bs,4,,10bm5,360f10{i30vw90br5,360,2,2f4{i30v~ko}w10ay0.05}";
        
        function FirstSample() {
            CMLObject.initialize(true);
            var seed:Particle = new Particle();
            seed.create(0, 0);
            seed.execute(new CMLSequence(script));
            addChild(new Bitmap(Particle.field));
            addEventListener(Event.ENTER_FRAME, function(e:Event) : void {
                Particle.field.colorTransform(Particle.field.rect, colt);
                Particle.color = FColor.HSVtoValue(hue++, .75, 1, 1);
                CMLObject.update();
            });
        }
        
        private var colt:ColorTransform = new ColorTransform(.875,.875,.875);
        private var hue:Number = 0;
    }
}


import flash.geom.Rectangle;
import flash.display.BitmapData;
import org.si.cml.CMLObject;

class Particle extends CMLObject {
    static public var color:uint;
    static public var field:BitmapData = new BitmapData(465, 465, false, 0);
    static private var _freeList:Array = [];
    static private var _rect:Rectangle = new Rectangle(0,0,3,3);
    static private function _new() : Particle { return _freeList.pop() || new Particle(); }
    
    function Particle() {}
    override public function onNewObject(args:Array) : CMLObject { return _new(); }
    override public function onFireObject(args:Array) : CMLObject { return _new(); }
    override public function onDestroy() : void { _freeList.push(this); }
    override public function onUpdate() : void {
        _rect.x = x+231;
        _rect.y = y+231;
        field.fillRect(_rect, color);
        if (this.x<-235 || this.x>235|| this.y<-235 || this.y>235) this.destroy(0);
    }
}

