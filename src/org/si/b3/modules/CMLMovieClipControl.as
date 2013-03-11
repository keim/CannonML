//--------------------------------------------------------------------------------
// Controler operating module
//--------------------------------------------------------------------------------


package org.si.b3.modules {
    import flash.events.*;
    import flash.ui.Keyboard;
    import flash.display.*;
    import flash.geom.*;
    import flash.utils.*;
    import org.si.b3.*;
    
    
    /** Controler operating module */
    public class CMLMovieClipControl
    {
    // constant variables
    //--------------------------------------------------------------------------------
        static public const KEY_UP      :uint = 0;
        static public const KEY_DOWN    :uint = 1;
        static public const KEY_LEFT    :uint = 2;
        static public const KEY_RIGHT   :uint = 3;
        static public const KEY_BUTTON0 :uint = 4;
        static public const KEY_BUTTON1 :uint = 5;
        static public const KEY_BUTTON2 :uint = 6;
        static public const KEY_BUTTON3 :uint = 7;
        static public const KEY_BUTTON4 :uint = 8;
        static public const KEY_BUTTON5 :uint = 9;
        static public const KEY_BUTTON6 :uint = 10;
        static public const KEY_BUTTON7 :uint = 11;
        static public const KEY_START   :uint = 12;
        static public const KEY_RESET   :uint = 13;
        static public const KEY_ESCAPE  :uint = 14;
        static public const KEY_SYSTEM  :uint = 15;
        static public const KEY_MAX     :int  = 16;
        
        static private var _keycode_map:* = {
            "A":65, "B":66, "C":67, "D":68, "E":69, "F":70, "G":71, "G":72, "I":73, "J":74, 
            "K":75, "L":76, "M":77, "N":78, "O":79, "P":80, "Q":81, "R":82, "S":83, "T":84, 
            "U":85, "V":86, "W":87, "X":88, "Y":89, "Z":90, ";":186, ",":188, ".":190, 
            "0":48, "1":49, "2":50, "3":51, "4":52, "5":53, "6":54, "7":55, "8":56, "9":57, 
            "NUM0":96, "NUM1":97, "NUM2":98, "NUM3":99, "NUM4":100,
            "NUM5":101, "NUM6":102, "NUM7":103, "NUM8":104, "NUM9":105,
            "CONTROL":Keyboard.CONTROL, "SHIFT":Keyboard.SHIFT, "ENTER":Keyboard.ENTER, "SPACE":Keyboard.SPACE,
            "BACKSPACE":Keyboard.BACKSPACE, "DELETE":Keyboard.DELETE, "INSERT":Keyboard.INSERT,
            "END":Keyboard.END, "HOME":Keyboard.HOME, "PAGE_DOWN":Keyboard.PAGE_DOWN, "PAGE_UP":Keyboard.PAGE_UP, 
            "UP":Keyboard.UP, "DOWN":Keyboard.DOWN, "LEFT":Keyboard.LEFT, "RIGHT":Keyboard.RIGHT
        };        
        
        
        
        
    // variables
    //----------------------------------------
        /** @private unique instance */
        static internal var instance:CMLMovieClipControl;
        
        private var _flagPressed:int;           // button status flag
        private var _supportJoyServer:Boolean;  // support JoyServer
       
        private var _keyCode:Vector.<Vector.<int>> = new Vector.<Vector.<int>>(KEY_MAX); // key code
        private var _counter:Vector.<int> = new Vector.<int>(KEY_MAX);                   // key counter
        
        
        
        
    // properties
    //----------------------------------------
        /** get x input (-1 <-> +1).
         *  @return -1 for left, 1 for right
         */
        public function get x() : Number
        {
            return (((_flagPressed & 8) >> 3) - ((_flagPressed & 4) >> 2));
        }
        
        
        /** get y input (-1 <-> +1).
         *  @return -1 for up, 1 for down
         */
        public function get y() : Number
        {
            return (((_flagPressed & 2) >> 1) - (_flagPressed & 1));
        }
        
        
        /** get button status flag. you can get the pressing status by (flag >> [key enum]) & 1 for each key. */
        public function get flag() : uint
        {
            return _flagPressed;
        }
        
        
        
        
    // constructor
    //----------------------------------------
        /** @private constructor */
        public function CMLMovieClipControl()
        {
            initialize();
            mapArrowKeys();
            mapNumKeys();
            mapWSAD();
            mapButtons(["Z","N","CONTROL"], ["X","M","SHIFT"], ["C",","], ["V","."]);
            instance = this;
        }
        
        
        
        
    // operations
    //----------------------------------------
        /** initialize all assigned keys
         *  @return this instance
         */
        public function initialize() : CMLMovieClipControl
        {
            for(var i:int=0; i<KEY_MAX; ++i) _keyCode[i] = new Vector.<int>();
            _supportJoyServer = false;
            reset();
            return this;
        }
        
        
        /** reset all flags
         *  @return this instance
         */
        public function reset() : CMLMovieClipControl
        {
            _flagPressed = 0;
            for(var i:int=0; i<KEY_MAX; ++i) { _counter[i] = 0; }
            return this;
        }
        
        
        /** assign keycode to the BUTTON_NUMBER 
         *  @param buttonNumber button number to assign
         *  @param args keycodes of assigning buttons
         *  @return this instance
         */
        public function map(buttonNumber:int, ...args) : CMLMovieClipControl
        {
            var codeList:Vector.<int> = _keyCode[buttonNumber];
            if (args.length == 1 && args[0] is Array) args = args[0];
            for (var i:int=0; i<args.length; i++) {
                if (args[i] is String) {
                    if (args[i] in _keycode_map) {
                        codeList.push(_keycode_map[args[i]]);
                    } else {
                        throw new Error("No keycode for String '" + args[i] + "'");
                    }
                } else {
                    if (int(args[i]) > 0) codeList.push(int(args[i]));
                }
            }
            return this;
        }
        
        
        /** assign arrow keys as moving button
         *  @param button0 Array, String or int for button0
         *  @param button1 Array, String or int for button1
         *  @param button2 Array, String or int for button2
         *  @param button3 Array, String or int for button3
         *  @return this instance
         */
        public function mapArrowKeys(button0:Array=null, button1:Array=null, button2:Array=null, button3:Array=null) : CMLMovieClipControl
        {
            map(KEY_UP, "UP").map(KEY_DOWN, "DOWN").map(KEY_LEFT, "LEFT").map(KEY_RIGHT, "RIGHT");
            return mapButtons(button0, button1, button2, button3);
        }
        
        
        /** assign number keys (8246) as moving button
         *  @param button0 Array, String or int for button0
         *  @param button1 Array, String or int for button1
         *  @param button2 Array, String or int for button2
         *  @param button3 Array, String or int for button3
         *  @return this instance
         */
        public function mapNumKeys(button0:Array=null, button1:Array=null, button2:Array=null, button3:Array=null) : CMLMovieClipControl
        {
            map(KEY_UP, "NUM8").map(KEY_DOWN, "NUM2").map(KEY_LEFT, "NUM4").map(KEY_RIGHT, "NUM6");
            return mapButtons(button0, button1, button2, button3);
        }
        
        
        /** assign "WSAD" keys as moving button
         *  @param button0 Array, String or int for button0
         *  @param button1 Array, String or int for button1
         *  @param button2 Array, String or int for button2
         *  @param button3 Array, String or int for button3
         *  @return this instance
         */
        public function mapWSAD(button0:Array=null, button1:Array=null, button2:Array=null, button3:Array=null) : CMLMovieClipControl
        {
            map(KEY_UP, "W").map(KEY_DOWN, "S").map(KEY_LEFT, "A").map(KEY_RIGHT, "D");
            return mapButtons(button0, button1, button2, button3);
        }
        
        
        /** assign all buttons
         *  @param button0 Array, String or int for button0
         *  @param button1 Array, String or int for button1
         *  @param button2 Array, String or int for button2
         *  @param button3 Array, String or int for button3
         *  @return this instance
         */
        public function mapButtons(button0:Array=null, button1:Array=null, button2:Array=null, button3:Array=null) : CMLMovieClipControl
        {
            map(KEY_BUTTON0, button0);
            map(KEY_BUTTON1, button1);
            map(KEY_BUTTON2, button2);
            map(KEY_BUTTON3, button3);
            return this;
        }
        
        
        /** Check button state, this property returns true while the key pressed.
         *  @param buttonNumber button number
         *  @return key pressing status
         */
        public function isPressed(buttonNumber:uint) : Boolean
        {
            return Boolean(_flagPressed & (1<<buttonNumber));
        }
        
        
        /** Check button state, this property returns true only at the first frame of pressing key.
         *  @param buttonNumber button number
         *  @return key pressing status
         */
        public function isHitted(buttonNumber:uint) : Boolean
        {
            return (_counter[buttonNumber] == 1);
        }
        
        
        /** Get pressed frames 
         *  @param buttonNumber button number
         *  @return frame count the key pressed.
         */
        public function getPressedFrame(buttonNumber:uint) : int
        {
            return _counter[buttonNumber];
        }
        
        
        
        
    // event handlers
    //----------------------------------------
        // handler for KeyboardEvent.KEY_DOWN
        private function _onKeyDown(event:KeyboardEvent) : void
        {
            var i:int, j:int, jmax:int, kc:Vector.<int>,
                targetCode:int = event.keyCode;
            for (i=0; i<KEY_MAX; ++i) {
                kc = _keyCode[i];
                jmax = kc.length;
                for (j=0; j<jmax; j++) {
                    if (kc[j] == targetCode) {
                        _flagPressed |= (1 << i);
                    }
                }
            }
        }
        
        
        // handler for KeyboardEvent.KEY_UP
        private function _onKeyUp(event:KeyboardEvent) : void
        {
            var i:int, j:int, jmax:int, kc:Vector.<int>,
                targetCode:int = event.keyCode;
            for (i=0; i<KEY_MAX; ++i) {
                kc = _keyCode[i];
                jmax = kc.length;
                for (j=0; j<jmax; j++) {
                    if (kc[j] == targetCode) {
                        _flagPressed &= ~(1 << i);
                    }
                }
            }
        }
        
        
        

    // internals
    //----------------------------------------
        /** @private call from Event.ENTER_FRAME */
        internal function _updateCounter() : void
        {
            var i:int, flag:uint = _flagPressed;
            for (i=0; i<KEY_MAX; ++i) {
                if (flag & 1) _counter[i]++;
                else          _counter[i] = 0;
                flag >>= 1;
            }
        }
        
        
        /** @private call from Event.ADDED_TO_STAGE */
        _cmlmovieclip_internal function _onAddedToStage(e:Event) : void
        {
            e.target.stage.addEventListener(KeyboardEvent.KEY_DOWN, _onKeyDown);
            e.target.stage.addEventListener(KeyboardEvent.KEY_UP,   _onKeyUp);
        }
    }
}

