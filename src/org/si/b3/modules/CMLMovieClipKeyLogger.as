//--------------------------------------------------------------------------------
// key logger
//--------------------------------------------------------------------------------


package org.si.b3.modules {
    /** Key logger */
    public class CMLMovieClipKeyLogger
    {
    // variables
    //----------------------------------------
        static public const RECORD:uint = 0;
        static public const REPLAY:uint = 1;
        
        
        
        
    // variables
    //----------------------------------------
        private var _log:Vector.<uint>;
        private var _pointer:int;
        private var _frameCount:int;
        private var _currentState:int;
        private var _status:uint;
        
        
        /** recording status, CMLMovieClip.RECORD or CMLMovieClip.REPLAY */
        public function get status() : int { return _status; } 
        
        
        
        
    // constructor
    //----------------------------------------
        /** @private constructor */
        function CMLMovieClipKeyLogger()
        {
        }
        
        
        
        
    // operations
    //----------------------------------------
        /** initialize 
         */
        public function initialize() : void 
        {
            _log = new Vector.<uint>();
            reset();
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
                _currentState = -1;
                _pointer = 0;
            } else {
                // REPLAY
                _frameCount = (_log[0] >> 16);
                _currentState = _log[0] & 0xffff;
                _pointer = 1;
            }
        }
        
        
        /** @private record and replay
         */
        internal function _record(flag:int) : int 
        {
            var data:int;
            if (_status == RECORD) {
                // RECORD
                _frameCount++;
                if (_currentState != flag) {
                    data = (_frameCount<<16) | flag;
                    _log.push(data);
                    _currentState = flag;
                }
            } else {
                // REPLAY
                --_frameCount;
                if (_frameCount < 0) {
                    data = _log[_pointer];
                    _frameCount = data >> 16;
                    _currentState = data & 0xffff;
                    _pointer++;
                }
            }
            return _currentState;
        }
    }
}

