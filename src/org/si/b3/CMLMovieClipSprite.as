//--------------------------------------------------------------------------------
// CMLMovieClip Scene management module
//--------------------------------------------------------------------------------


package org.si.b3 {
    import org.si.cml.*;
    import org.si.cml.extensions.*;
    
    
    /** CMLMovieClipSprite is a sprite class on CMLMovieClip. */
    public class CMLMovieClipSprite extends Actor {
        /** constructor */
        function CMLMovieClipSprite() {
            
        }
        
        
    // Event callback functions 
    //------------------------------------------------------------
        /** @inheritDoc */
        override public function onCreate() : void {
        }
        
        
        /** @inheritDoc */
        override public function onDestroy() : void {
        }
        
        
        /** @inheritDoc */
        override public function onNewObject(args:Array) : CMLObject {
            return null;
        }
        
        
        /** @inheritDoc  */
        override public function onFireObject(args:Array) : CMLObject {
            return null;
        }
        
        
        /** @inheritDoc  */
        override public function onUpdate() : void {
            if (isEscaped) destroy(0);
        }
    }
}


