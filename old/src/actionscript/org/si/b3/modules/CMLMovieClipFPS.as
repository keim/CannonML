//--------------------------------------------------------------------------------
// CMLMovieClip FPS controling module
//--------------------------------------------------------------------------------


package org.si.b3.modules {
    import flash.events.*;
    import flash.display.*;
    import flash.utils.getTimer;
    import org.si.b3.CMLMovieClip;
    
    
    /** FPS controling module */
    public class CMLMovieClipFPS
    {
    // valiables
    //----------------------------------------
        /** @private unique instance */
        static internal var instance:CMLMovieClipFPS;
        
        private var _frameRateMS:Number;    // frame rate on [ms]
        
        private var _frameCounter:uint;     // frame count
        private var _startTime:int;         // starting time
        private var _delayedFrames:Number;  // delayed frame count
        private var _frameSkipLevel:int;    // frame skip level
        
        private var _frameSkipFilter:Vector.<uint> = Vector.<uint>([
            0xffffffff, // level 0 = no skipping
            63,         // level 1 = skipped by 64 frames each
            31,         // level 2 = skipped by 32 frames each
            15,         // level 3 = skipped by 16 frames each
            7,          // level 4 = skipped by 8 frames each
            3,          // level 5 = skipped by 4 frames each
            1,          // level 6 = skipped by 2 frames each
            0           // level 7 = skip all frames
        ]);
        
        
        
    // properties
    //----------------------------------------
        /** frame skip level */
        public function get frameSkipLevel() : int
        {
            return _frameSkipLevel;
        }
        
        
        /** delayed frame count */
        public function get delayedFrames() : Number
        {
            return _delayedFrames;
        }
        
        
        /** total frame count */
        public function get totalFrame() : int
        {
            return _frameCounter;
        }
        
        
        
        
    // constructor
    //----------------------------------------
        /** constructor */
        public function CMLMovieClipFPS()
        {
            _frameRateMS = 0;
            initialize();
            instance = this;
        }
        
        
        
        
    // operations
    //----------------------------------------
        /** initialize FPS setting */
        public function initialize() : CMLMovieClipFPS
        {
            reset();
            return this;
        }
        
        
        /** reset counters */
        public function reset() : CMLMovieClipFPS
        {
            _startTime = getTimer();
            _frameCounter = 0;
            _delayedFrames = 0;
            return this;
        }
        
        
        
        
    // event handlers
    //----------------------------------------
        /** @private call from Event.ENTER_FRAME */
        internal function _sync() : Boolean
        {
            _frameCounter++;
            if ((_frameCounter & 15) == 0 || _delayedFrames > 5) {
                _delayedFrames = (getTimer() - _startTime) * _frameRateMS - _frameCounter;
                _frameSkipLevel = (_delayedFrames < 2) ? 0 : (_delayedFrames > 14) ? 7 : int(_delayedFrames * 0.5);
            }
            return ((_frameCounter & _frameSkipFilter[_frameSkipLevel]) == 0);
        }
        
        
        /** @private call from Event.ADDED_TO_STAGE */
        _cmlmovieclip_internal function _onAddedToStage(e:Event) : void
        {
            _frameRateMS = e.target.stage.frameRate * 0.001;
        }
    }
}

