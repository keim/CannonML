//--------------------------------------------------------------------------------
// key logger
//--------------------------------------------------------------------------------


package org.si.b3.modules {
    /** Key logger */
    public class CMLMovieClipKeyLogger
    {
    // variables
    //----------------------------------------    
        static public const STOP:uint = 0;
        static public const RECORD:uint = 1;
        static public const REPLAY:uint = 2;
        
        
        
        
    // variables
    //----------------------------------------
        private var _log:Vector.<uint>;
        private var _pointer:int, _pointerEnd:int;
        private var _frameCount:int;
        private var _currentState:int;
        private var _status:uint = 0;
        
        
        /** recording status, CMLMovieClip.RECORD or CMLMovieClip.REPLAY */
        public function get status() : int { return _status; } 
        
        
        
    // constructor
    //----------------------------------------
        /** @private constructor */
        function CMLMovieClipKeyLogger()
        {
            _log = new Vector.<uint>();
        }
        
        
        
        
    // operations
    //----------------------------------------
        /** getReplay 
         */
        public function get getReplay() : Vector.<uint> 
        {
            return _log;
        }    
	
        /** initialize 
         */
        public function initialize(log:Vector.<uint>=null) : void 
        {
            if (log) {
                _log = log;
                reset(0);
            } else {
                _log = new Vector.<uint>();
                reset(1);
            }
        }
        
        
        /** reset 
         *  @param status 
         */
        public function reset(status:uint=0) : void 
        {
            _status = status;
            if (_status == RECORD) {
                // RECORD
                _log.length = 0;
                _frameCount = 0;
                _currentState = 0;
                _pointer = 0;
            } else if (_status == REPLAY && _log.length !=0) {
                // REPLAY
                _frameCount = (_log[0] >> 16);
                _currentState = _log[0] & 0xffff;
                _pointer = 0;
            }
        }
        
        
        /** @private record and replay
         */
        internal function _record(flag:int) : int 
        {
            var data:int;
            if (_status == RECORD) {
                // RECORD
                if (_currentState != flag) {
                    data = (g.mc.fps.totalFrame<<16) | flag;
                    _log.push(data);
                    _currentState = flag;
                }
            } else if (_status == REPLAY && _log.length !=0) {
                // REPLAY
                if (_pointer == _log.length -1) {
                    _status = STOP ;
                    _currentState = 0;
                } else {
                    data = _log[_pointer];
                    _frameCount = data >> 16;
                    if (_frameCount <= g.mc.fps.totalFrame) {
                        if (g.mc.fps.totalFrame - _frameCount != 0) trace("replay desync by ", g.mc.fps.totalFrame - _frameCount, " frames.");
                        _currentState = data & 0xffff;
                        _pointer++;
                    }
                }
            } else _currentState = flag;
            return _currentState;
        }
    }
}

