//--------------------------------------------------------------------------------
// CMLMovieClip
//--------------------------------------------------------------------------------
package org.si.b3 {
    import flash.geom.*;
    import flash.events.*;
    import flash.display.*;
    import org.si.cml.*;
    import org.si.cml.extensions.*;
    import org.si.b3.modules.*;
    
    
    /** CMLMovieClip is a very simple framework for shmups ! <br/> 
     *  This class manages scenes, controler, fps, screen and basic cannonML operations.
     */
    public class CMLMovieClip extends Bitmap
    {
    // constants
    //--------------------------------------------------------------------------------
        // label for vertical scroll
        static public const VERTICAL:String = "vertical";
        // label for horizontal scroll
        static public const HORIZONTAL:String = "horizontal";
        
        
        
        
    // variables
    //--------------------------------------------------------------------------------
        /** Controler management module */
        public var control:CMLMovieClipControl;
        /** FPS management module */
        public var fps    :CMLMovieClipFPS;
        /** Scene management module */
        public var scene  :CMLMovieClipScene;
        /** Screen */
        public var screen:BitmapData = null;
        /** Pause flag */
        public var pause:Boolean = false;
        
        private var _addEnterFrameListener:Boolean;     // flag to add enter frame event listener 
        private var _onFirstEnterFrame:Function = null; // callback function whrn first enter frame event appears.
        private var _clearColor:uint = 0;               // clear color
        private var _offsetX:Number = 0;
        private var _offsetY:Number = 0;
        private var _scopeMargin:Number = 32;
        private var _vscrollFlag:Boolean = true;

        private var _rc:Rectangle = new Rectangle();             // multi-purpose
        private var _pt:Point = new Point();                     // multi-purpose
        private var _mat:Matrix = new Matrix();                  // multi-purpose
        //private var _colt:ColorTransform = new ColorTransform(); // multi-purpose
        
        
        
        
    // properties
    //--------------------------------------------------------------------------------
        /** margin of object's moving range. */
        public function get scopeMargin() : Number { return _scopeMargin; }
        public function set scopeMargin(margin:Number) : void {
            var sm2:Number = scopeMargin * 2;
            _scopeMargin = margin;
            ScopeLimitObject.setDefaultScope(-_offsetX-margin, -_offsetY-margin, screen.width+sm2, screen.height+sm2);
        }
        
        
        /** clear color */
        public function get clearColor() : uint { return _clearColor; }
        public function set clearColor(col:uint) : void { 
            _clearColor = col;
        }
        
        
        
        
    // enum for keys
    //--------------------------------------------------------------------------------
        static public const KEY_UP      :uint = CMLMovieClipControl.KEY_UP;
        static public const KEY_DOWN    :uint = CMLMovieClipControl.KEY_DOWN;
        static public const KEY_LEFT    :uint = CMLMovieClipControl.KEY_LEFT;
        static public const KEY_RIGHT   :uint = CMLMovieClipControl.KEY_RIGHT;
        static public const KEY_BUTTON0 :uint = CMLMovieClipControl.KEY_BUTTON0;
        static public const KEY_BUTTON1 :uint = CMLMovieClipControl.KEY_BUTTON1;
        static public const KEY_BUTTON2 :uint = CMLMovieClipControl.KEY_BUTTON2;
        static public const KEY_BUTTON3 :uint = CMLMovieClipControl.KEY_BUTTON3;
        static public const KEY_BUTTON4 :uint = CMLMovieClipControl.KEY_BUTTON4;
        static public const KEY_BUTTON5 :uint = CMLMovieClipControl.KEY_BUTTON5;
        static public const KEY_BUTTON6 :uint = CMLMovieClipControl.KEY_BUTTON6;
        static public const KEY_BUTTON7 :uint = CMLMovieClipControl.KEY_BUTTON7;
        static public const KEY_START   :uint = CMLMovieClipControl.KEY_START;
        static public const KEY_RESET   :uint = CMLMovieClipControl.KEY_RESET;
        static public const KEY_ESCAPE  :uint = CMLMovieClipControl.KEY_ESCAPE;
        static public const KEY_SYSTEM  :uint = CMLMovieClipControl.KEY_SYSTEM;
        
        
        
        
    // constructor
    //--------------------------------------------------------------------------------
        /** constructor.
         *  @param parent parent DisplayObjectContainer
         *  @param xpos position x
         *  @param ypos position y
         *  @param width screen width
         *  @param height screen height
         *  @param clearColor clear color
         *  @param addEnterFrameListener add Event.ENTER_FRAME event listener.
         *  @param scopeMargin margin of object's moving range.
         *  @param scrollDirecition scrolling direction CMLMovieClip.VERTICAL or CMLMovieClip.HORIZONTAL is available.
         */
        function CMLMovieClip(parent:DisplayObjectContainer, xpos:int, ypos:int, width:int, height:int, clearColor:int=0x000000, 
                              addEnterFrameListener:Boolean=true, onFirstEnterFrame:Function=null, scopeMargin:Number=32, scrollDirecition:String="vertical") : void
        {
            super(null);
            
            control = new CMLMovieClipControl();
            fps     = new CMLMovieClipFPS();
            scene   = new CMLMovieClipScene();
            
            setSize(width, height, clearColor, scopeMargin);
            _vscrollFlag = (scrollDirecition != HORIZONTAL);
            
            _addEnterFrameListener = addEnterFrameListener;
            _onFirstEnterFrame = onFirstEnterFrame;
            addEventListener(Event.ADDED_TO_STAGE, function(e:Event) : void {
                e.target.removeEventListener(e.type, arguments.callee);
                control._cmlmovieclip_internal::_onAddedToStage(e);
                fps._cmlmovieclip_internal::_onAddedToStage(e);
                addEventListener(Event.ENTER_FRAME, _onFirstUpdate);
            });
            
            this.x = xpos;
            this.y = ypos;
            parent.addChild(this);
        }
        
        
        /** Set screen size
         *  @param width screen width
         *  @param height screen height
         *  @param clearColor clear color
         *  @param scopeMargin margin of object's moving range.
         *  @return this instance
         */
        public function setSize(width:int, height:int, clearColor:int=0x000000, scopeMargin:Number=32) : CMLMovieClip
        {
            _clearColor = clearColor;
            if (!screen || screen.width != width || screen.height != height) {
                if (screen) screen.dispose();
                screen = new BitmapData(width, height, false, clearColor);
                this.bitmapData = screen;
                _offsetX = screen.width * 0.5;
                _offsetY = screen.height * 0.5;
            }
            this.scopeMargin = scopeMargin;
            return this;
        }
        
        
        /** update for one frame */
        public function update(e:Event=null) : void
        {
            if (!pause) {
                CMLObject.update();
            }
            scene._cmlmovieclip_internal::_onUpdate();
        }
        
        
        // callback when first update
        private function _onFirstUpdate(e:Event) : void
        {
            removeEventListener(Event.ENTER_FRAME, _onFirstUpdate);
            Actor.initialize(_vscrollFlag);
            if (_onFirstEnterFrame != null) _onFirstEnterFrame();
            if (_addEnterFrameListener) {
                addEventListener(Event.ENTER_FRAME, update);
            }
        }
        
        
        
        
    // screen operations
    //--------------------------------------------------------------------------------
        /** clear screen. fill all of screen by clearColor */
        public function clearScreen() : CMLMovieClip
        {
            screen.fillRect(screen.rect, _clearColor);
            return this;
        }
        
        
        /** call screen.fillRect without Rectangle instance. 
         *  @param color fill color
         *  @param x x of left edge
         *  @param y y of top edge
         *  @param width rectangle width
         *  @param height rectangle height
         */
        public function fillRect(color:uint, x:int, y:int, width:int, height:int) : CMLMovieClip
        {
            _rc.x = x + _offsetX;
            _rc.y = y + _offsetY;
            _rc.width = width;
            _rc.height = height;
            screen.fillRect(_rc, color);
            return this;
        }
        
        
        /** call screen.copyPixels without Rectangle instance. 
         *  @param src source BitmapData
         *  @param srcX x of copying area's left edge
         *  @param srcY y of copying area's top edge
         *  @param srcWidth width of copying area
         *  @param srcHeight height of copying area
         *  @param dstX paste x
         *  @param dstY paste y
         */
        public function copyPixels(src:BitmapData, srcX:int, srcY:int, srcWidth:int, srcHeight:int, dstX:int, dstY:int) : CMLMovieClip
        {
            _rc.x = srcX;
            _rc.y = srcY;
            _rc.width = srcWidth;
            _rc.height = srcHeight;
            _pt.x = dstX + _offsetX;
            _pt.y = dstY + _offsetY;
            screen.copyPixels(src, _rc, _pt);
            return this;
        }
        
        
        /** call screen.draw without Matrix
         *  @param src source IBitmapDrawable
         *  @param xpos left position x of source
         *  @param ypos top position y of source
         *  @param scaleX horizontal scaling factor
         *  @param scaleY vertical scaling factor
         *  @param angle rotating angle in degree
         *  @param blendMode blend mode
         *  @param colorTransform color transform
         */
        public function draw(src:IBitmapDrawable, xpos:Number, ypos:Number, scaleX:Number=1, scaleY:Number=1, angle:Number=0, blendMode:String=null, colorTransform:ColorTransform=null) : CMLMovieClip
        {
            _mat.a = scaleX;
            _mat.d = scaleY;
            _mat.ty = _mat.tx = _mat.b = _mat.c = 0;
            if (angle != 0) _mat.rotate(angle);
            _mat.translate(xpos + _offsetX, ypos + _offsetY);
            screen.draw(src, _mat, colorTransform, blendMode);
            return this;
        }
        
        
        /** copy CMLMovieClipTexture to the screen
         *  @param texture CMLMovieClipTexture instance
         *  @param x x of texture center
         *  @param y y of texture center
         *  @param animIndex animation index
         */
        public function copyTexture(texture:CMLMovieClipTexture, x:int, y:int, animIndex:int=0) : CMLMovieClip
        {
            var tex:CMLMovieClipTexture = texture.animationPattern[animIndex];
            _pt.x = x - tex.center.x + _offsetX;
            _pt.y = y - tex.center.y + _offsetY;
            screen.copyPixels(tex.bitmapData, tex.rect, _pt);
            return this;
        }
        
        
        /** draw CMLMovieClipTexture to the screen, you have to set CMLMovieClipTexture.drawable = true.
         *  @param src source IBitmapDrawable
         *  @param xpos center position x of source
         *  @param ypos center position y of source
         *  @param scaleX horizontal scaling factor
         *  @param scaleY vertical scaling factor
         *  @param angle rotating angle in degree
         *  @param blendMode blend mode
         *  @param colorTransform color transform
         *  @param animIndex animation index
         */
        public function drawTexture(texture:CMLMovieClipTexture, xpos:Number, ypos:Number, scaleX:Number=1, scaleY:Number=1, angle:Number=0, blendMode:String=null, colorTransform:ColorTransform=null, animIndex:int=0) : CMLMovieClip
        {
            var tex:CMLMovieClipTexture = texture.animationPattern[animIndex];
            _mat.a = scaleX;
            _mat.d = scaleY;
            _mat.b = _mat.c = 0;
            _mat.tx = -tex.center.x * scaleX;
            _mat.ty = -tex.center.y * scaleY;
            if (angle != 0) _mat.rotate(angle * 0.017453292519943295);
            _mat.translate(xpos + _offsetX, ypos + _offsetY);
            screen.draw(tex.bitmapData, _mat, colorTransform, blendMode);
            return this;
        }
    }
}



