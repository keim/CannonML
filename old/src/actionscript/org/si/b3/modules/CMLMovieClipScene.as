//--------------------------------------------------------------------------------
// CMLMovieClip Scene management module
//--------------------------------------------------------------------------------


package org.si.b3.modules {
    import flash.display.*;
    import flash.events.*;
    import org.si.b3.*;
    
    
    /** CMLMovieClipScene manages scene transition. */
    public class CMLMovieClipScene
    {
    // member values
    //----------------------------------------
        private var _currentSceneID:String;
        private var _nextSceneID:String;
        private var _sceneList:*;
        
        private var _funcUpdate:Function;
        private var _funcDraw:Function;
        private var _funcExit:Function;
        
        
        
        
    // constructor
    //----------------------------------------
        /** @private constructor */
        public function CMLMovieClipScene()
        {
            initialize();
        }
        
        
        
        
    // operations
    //----------------------------------------
        /** initialize */
        public function initialize() : CMLMovieClipScene
        {
            _sceneList = {};
            return reset();
        }
        
        
        /** reset */
        public function reset() : CMLMovieClipScene
        {
            _currentSceneID = _nextSceneID = null;
            _funcUpdate = _funcDraw = _funcExit = _nop;
            return this;
        }

        
        /** register scene */
        public function register(sceneID:String, scene:*) : CMLMovieClipScene
        {
            _sceneList[sceneID] = scene;
            return this;
        }
        
        
        

    // references
    //----------------------------------------
        /** current scene id. if you set this property the sceneID is changed at the head of next frame. */
        public function get id() : String
        {
            return _currentSceneID;
        }
        public function set id(sceneID:String) : void
        {
            _nextSceneID = sceneID;
        }
        
        
        

    // internals
    //----------------------------------------
        /** @private call from CMLMovieClip.update() */
        _cmlmovieclip_internal function _onUpdate() : void
        {
            CMLMovieClipControl.instance._updateCounter();
            do {
                _funcUpdate();
                if (_currentSceneID != _nextSceneID) {
                    _funcExit();
                    do {
                        _currentSceneID = _nextSceneID;
                        if (_currentSceneID && _sceneList[_currentSceneID]) {
                            var scene:* = _sceneList[_currentSceneID];
                            _funcUpdate = scene.update || _nop;
                            _funcDraw   = scene.draw   || _nop;
                            _funcExit   = scene.exit   || _nop;
                            if (scene.enter != undefined) scene.enter();
                        } else {
                            _funcUpdate = _funcDraw = _funcExit = _nop;
                        }
                    } while (_currentSceneID != _nextSceneID);
                }
            } while (CMLMovieClipFPS.instance._sync());
            _funcDraw();
        }
        
        
        // no operation
        private function _nop() : void { }
    }
}


