//----------------------------------------------------------------------------------------------------
// Translator from BulletML to CannonML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLSequence;
    import org.si.cml.namespaces._cml_internal;
    import flash.utils.*;
    
    
    /** You can use the XML object of BulletML in CMLSequence constructor directly, So this class is only for a translation purpose.
     *  @example
<listing version="3.0">
    // Create CMLSequence from bulletML directly.
    var seq:CMLSequence = new CMLSequence(bulletML as XML);
    
    // You can refer the translation result of bulletML if you need.
    trace(BMLParser.cmlString);
    
     ...
    
    // "enemy" is an instance of CMLObject. You can execute bulletML from CMLObject.execute().
    enemy.execute(seq);
</listing>
     *  @see CMLSequence#CMLSequence()
     *  @see BMLParser#cmlString
     */
    public class BMLParser
    {
        /** The namespace of bulletML, xmlnx='http://www.asahi-net.or.jp/~cs8k-cyu/bulletml'. */
        static public var bulletMLNameSpace:Namespace = new Namespace("http://www.asahi-net.or.jp/~cs8k-cyu/bulletml");

        
        /** @private */
        function BMLParser()
        {
        }
        
        
        // Parse BulletML, and create sequence.
        /** @private */
        static _cml_internal function _parse(seq:CMLSequence, bulletML:XML) : void
        {
            CMLParser._cml_internal::_parse(seq, translate(bulletML));
        }
        
        
        /** Translate BulletML to CannonML. 
        * @param  bulletML XML of BulletML
        * @return cannonML string. Returns "" when there are no <bulletml>s in XML.
        */
        static public function translate(bulletML:XML) : String
        {
            // XML parsing rules
            XML.ignoreComments = true;
            XML.ignoreProcessingInstructions = true;
            XML.ignoreWhitespace = true;
            
            // bulletML default namespace
            default xml namespace = bulletMLNameSpace;

            // pick up <bulletml>
            var xml:XML = (bulletML.localName() == 'bulletml') ? bulletML : bulletML.bulletml[0];

            // start parsing
            _cml = "";
            _cmlStac.length = 0;
            _label.length = 0;
            _pushStac();
            if (!bulletml(xml)) return "";
            _flush();
            _popStac();
            
            return _cml;
        }
        

        /** CannonML string after translate() and constructor of CMLSequence. 
         *  You can pick up the cml string after "new CMLSequence(bulletML as XML)".
         */
        static public function get cmlString() : String
        {
            return _cml;
        }


        /** Errored XML. Returns null when there are no error. */
        static public function get erroredXML() : XML
        {
            return _erroredXML;
        }
        
        


    // bulletML elements with complex contents
    //--------------------------------------------------
        static private var _cml:String = "";
        static private var _cmlStac:Array = new Array();
        static private var _seqStac:Array = new Array();
        static private var _label:Array   = new Array();
        static private var _erroredXML:XML = null;
        
        
        static private function bulletml(xml:XML, defaultFunc:Function=null) : Boolean
        {
            if (xml.localName() != "bulletml") return false;
            
            var type:String = xml.@type;
            
            for each (var elem:XML in xml.children()) {
                if (!action(elem, false))
                if (!fire(elem, false))
                if (!bullet(elem, false)) 
                {
                    // parse other elements here
                    if (defaultFunc != null) {
                        if (!defaultFunc(elem)) throw _errorElement(xml, elem.localName());
                    }
                }
            }
            
            return true
        }
        
        
        static private function action(xml:XML, reference:Boolean=true) : Boolean
        {
            if (xml.localName() != "action") return false;
            
            // get parameters
            var lbl:String = _getLabel(xml, false);
            // parse contents
            _pushStac();
            _parseContentsSequencial(xml, fire, fireRef, action, actionRef, repeat, changeDirection, changeSpeed, accel, wait, vanish);
            var seq:String = _popStac();

            // write
            if (lbl!=null) {
                _pushStac();
                _write("#"+lbl+"{ "+seq+"}");
                _flush();
                _popStac();
                if (reference) {
                    _write("&"+lbl+_cmlArgumentProp(seq));
                    _seqStac[0].bseq = "nws";
                    _seqStac[0].bv   = "nws";
               }
            } else {
                _write_ns(seq);
            }
            
            return true;
        }
        
        
        static private function fire(xml:XML, reference:Boolean=true) : Boolean
        {
            if (xml.localName() != "fire") return false;

            // check contents
            var len:int = xml.bullet.length()+xml.bulletRef.length();
            if (len == 0) throw _errorNoElement(xml, "bullet|bulletRef");
            if (len > 1)  throw _errorHasOnlyOne(xml, "bullet|bulletRef");
            
            
            // get parameters
            var lbl:String = _getLabel(xml, false);
            var dir:String = _getDirection(xml);
            var spd:String = _getSpeed(xml);

            // parse contents
            _pushStac();
            _write((dir!=null)?dir:"ha");
            _write((spd!=null)?spd:"f1");
            _parseContentsSequencial(xml, bullet, bulletRef, skipDirSpd);
            var seq:String = _popStac();
            
            // write
            if (lbl!=null) {
                _pushStac();
                _write("#"+lbl+"{ "+seq+"}");
                _flush();
                _popStac();
                if (reference) {
                    _write("&"+lbl+_cmlArgumentProp(seq));
                    _seqStac[0].bseq = "nws";
                    _seqStac[0].bv   = "nws";
                }
            } else {
                _write_ns(seq);
            }

            return true;
        }
        
        
        static private function bullet(xml:XML, reference:Boolean=true) : Boolean
        {
            if (xml.localName() != "bullet") return false;
            
            // get parameters
            var lbl:String = _getLabel(xml, false);
            var dir:String = _getDirection(xml);
            var spd:String = _getSpeed(xml);
            
            // parse contents
            _pushStac();
            if (dir!=null) _write(dir + " cd");
            if (spd!=null) _write(spd);
            _parseContentsSequencial(xml, action, actionRef, skipDirSpd);
            var seq:String = _popStac();
            
            // write
            if (lbl!=null) {
                _pushStac();
                _write("#"+lbl+"{ "+seq+"}");
                _flush();
                _popStac();
                if (reference) _write(lbl+_cmlArgumentProp(seq));
            } else {
                if (reference) {
                    if (_seqStac[0].bseq != seq) {
                        _write("{ "+seq+"}"+_cmlArgumentProp(seq));
                        _seqStac[0].bseq = seq;
                    }
                }
            }
            
            return true;
        }

        
        static private function skipDirSpd(xml:XML) : Boolean
        {
            var str:String = xml.localName();
            return (str == "direction" || str == "speed");
        }
        
        
        static private function changeDirection(xml:XML) : Boolean
        {
            if (xml.localName() != "changeDirection") return false;
            var dir:String = _getDirection(xml);
            if (dir==null) throw _errorNoElement(xml, "direction");
            _write(dir);
            _write("i"+_getTerm(xml));
            _write("cd");
            return true;
        }


        static private function changeSpeed(xml:XML) : Boolean
        {
            if (xml.localName() != "changeSpeed") return false;
            var spd:String = _getSpeed(xml);
            if (spd==null) throw _errorNoElement(xml, "speed");
            _write("i"+_getTerm(xml));
            _write(spd);
            return true;
        }


        static private function accel(xml:XML) : Boolean
        {
            if (xml.localName() != "accel") return false;
            _write("i"+_getTerm(xml));
            _write(_typeStringH[_getType(xml.vertical[0], TYPE_ABSOLUTE)]);
            _write_ns("ad");
            _write_ns((xml.horizontal != undefined) ? _cmlArgument(xml.horizontal[0]) : "0")
            _write_ns(",");
            _write((xml.vertical != undefined) ? _cmlArgument(xml.vertical[0]) : "0");
            return true;
        }

        
        static private function repeat(xml:XML) : Boolean
        {
            if (xml.localName() != "repeat") return false;
            var times:String = _getTimes(xml);
            if (times != "1") _write("["+times);
            var len:int = xml.action.length() + xml.actionRef.length();
            if (len == 0) throw _errorNoElement(xml, "action|actionRef");
            if (len > 1 || xml.children.length() > 2) throw _errorHasOnlyOne(xml, "action|actionRef");
            if (xml.action.length()==1) action(xml.action[0]);
            else if (xml.actionRef.length()==1) actionRef(xml.actionRef[0]);
            if (times != "1") _write("]");
            return true;
        }


        static private function vanish(xml:XML) : Boolean
        {
            if (xml.localName() != "vanish") return false;
            _write("ko");
            return true;
        }


        static private function wait(xml:XML) : Boolean
        {
            if (xml.localName() != "wait") return false;
            var frame:String = _cmlArgument(xml.text()[0]);
            if (frame != "0") _write("w"+frame);
            return true;
        }


        static private function bulletRef(xml:XML) : Boolean
        {
            if (xml.localName() != "bulletRef") return false;
            var lbl:String = _getLabel(xml, true);
            _write(lbl);
            _write(_getParam(xml));
            return true;
        }

        
        static private function actionRef(xml:XML) : Boolean
        {
            if (xml.localName() != "actionRef") return false;
            var lbl:String = _getLabel(xml, true);
            _write("&"+lbl);
            _write(_getParam(xml));
            _seqStac[0].bseq = "nws";
            _seqStac[0].bv   = "nws";
            return true;
        }

        
        static private function fireRef(xml:XML) : Boolean
        {
            if (xml.localName() != "fireRef") return false;
            var lbl:String = _getLabel(xml, true);
            _write("&"+lbl);
            _write(_getParam(xml));
            _seqStac[0].bseq = "nws";
            _seqStac[0].bv   = "nws";
            return true;
        }




    // bulletML elements with single content
    //--------------------------------------------------
        static private var TYPE_UNDEFINED:int = -1;
        static private var TYPE_AIM:int      = 0;
        static private var TYPE_ABSOLUTE:int = 1;
        static private var TYPE_RELATIVE:int = 2;
        static private var TYPE_SEQUENCE:int = 3;
        static private var _typeString:Array   = ["aim", "absolute", "relative", "sequence"];
        static private var _typeStringH:Array  = ["ht",  "ha",       "ho",       "hs"];
        static private var _typeStringCS:Array = ["",    "csa",      "csr",      "css"];
            
        static private function _getDirection(xml:XML) : String
        {
            if (xml.direction == undefined) return null;
            var type:int = _getType(xml.direction[0], TYPE_AIM);
            var arg:String = _cmlArgument(xml.direction[0]);
            if (type == TYPE_ABSOLUTE) {
                var argn:Number = Number(arg);
                arg = (isNaN(argn)) ? (arg+"-180") : (argn == -180) ? ("0") : String(argn-180);
            }
            return _typeStringH[type] + arg;
        }

        
        static private function _getSpeed(xml:XML) : String
        {
            var type:int;
            switch (xml.localName()) {
                case 'bullet':
                case 'changeSpeed': {
                    if (xml.speed == undefined) return null;
                    type = _getType(xml.speed[0], TYPE_ABSOLUTE);
                    return _typeStringCS[type] + _cmlArgument(xml.speed[0]);
                }
                case 'fire': {
                    if (xml.speed == undefined) return null;
                    type = _getType(xml.speed[0], TYPE_ABSOLUTE);
                    var spd:String = _cmlArgument(xml.speed[0]);
                    var pre:String = "";
                    switch(type) {
                    case TYPE_RELATIVE:
                        return "f$v+"+ spd;
                    case TYPE_SEQUENCE:
                        if (_seqStac[0].bv == spd) return "f";
                        _seqStac[0].bv = spd;
                        return "bv"+spd+" f";
                    }
                    return "f"+spd;
                }
                default:
                throw _errorElement(xml.localName(), "speed");
            }
        }

        
        static private function _getTerm(xml:XML) : String
        {
            return (xml.term[0] != undefined) ? _cmlArgument(xml.term[0]) : "0";
        }

        
        static private function _getTimes(xml:XML) : String
        {
            return (xml.times[0] != undefined) ? _cmlArgument(xml.times[0]) : "";
        }
        
        
        static private function _getParam(xml:XML) : String
        {
            var imax:int = xml.param.length();
            if (imax == 0) return null;

            var str:String = _cmlArgument(xml.param[0]);
            for (var i:int=1; i<imax; ++i) {
                str += "," + _cmlArgument(xml.param[i]);
            }
            return str;
        }
        
        
        

    // sub routine for CML writing
    //--------------------------------------------------
        static private function _write(str:String) : void
        {
            if (str == null) return;
            _cmlStac[0] += str + " ";
        }

        
        static private function _write_ns(str:String) : void
        {
            if (str == null) return;
            _cmlStac[0] += str;
        }
        
        
        static private function _flush() : void
        {
            _cml+=_cmlStac[0];
        }

    
        static private function _pushStac() : void
        {
            _cmlStac.unshift("");
            _seqStac.unshift(new seqinfo());
        }
    
        
        static private function _popStac() : String
        {
            _seqStac.shift();
            return _cmlStac.shift();
        }

        
        
    
    // sub routine for XML
    //--------------------------------------------------
        static private function _parseContentsSequencial(xml:XML, ...elements) : void
        {
            var imax:int = elements.length;
            for each (var elem:XML in xml.children()) {
                for (var i:int=0; i<imax; ++i) {
                    if (elements[i](elem)) break;
                }
                if (i == imax) throw _errorElement(xml, elem.localName());
            }
        }


        static private function _getType(xml:XML, defaultAtt:int) : int
        {
            var type:XMLList = xml.@type;
            var att:int = (type.length()>0) ? _typeString.indexOf(type.toString()) : defaultAtt;
            if (att == TYPE_UNDEFINED) throw _errorAttribute(xml, "type", type.toString());
            return att;
        }
        
        
        static private function _getLabel(xml:XML, reference:Boolean) : String
        {
            var label:XMLList = xml.@label;
            if (label.length()==0) {
                if (reference) throw _errorNoAttribute(xml, "label");
                else return null;
            }
            return _cmlLabel(label.toString(), reference);
        }
        
        
        static private function _cmlLabel(label:String, reference:Boolean) : String
        {
            var cmlLabel:String;
            if (label in _dictLabel) {
                cmlLabel = _dictLabel[label];
            } else {
                cmlLabel = label.toUpperCase().replace(/^[0-9]/, '_$&').replace(/[^A-Z0-9]+/g,'_');
                _dictLabel[label] = cmlLabel;
            }
            if (!reference) {
                if (_label.indexOf(cmlLabel) != -1) {
                    var i:int = 0;
                    while (_label.indexOf(cmlLabel+String(i)) != -1) { ++i; }
                    cmlLabel += String(i);
                }
                _label.push(cmlLabel);
            }
            return cmlLabel;
        }
        static private var _dictLabel:Object = new Object();
        
        
        static private function _cmlArgument(arg:XML) : String
        {
            return arg.toString().replace(/\s+/g, '').replace(/\$rank/g, '$$r').replace(/\$rand/g, '$$?');
        }
        
        
        static private function _cmlArgumentProp(cmlString:String) : String
        {
            var rex:RegExp = /\$([1-9][0-9]?)/g;
            var argCount:int = 0;
            var idx:int = 0;
            var res:Object;
            while (res=rex.exec(cmlString)) {
                idx = int(res[1]);
                if (argCount < idx) argCount = idx;
            }
            if (argCount == 0) return "";
            var str:String = "$1";
            for (idx=1; idx<argCount; ++idx) { str+=",$"+String(idx+1); }
            return str;
        }


        

    // errors
    //--------------------------------------------------
        static private function _errorElement(xml:XML, elem:String) : Error
        {
            _erroredXML = xml;
            return new Error("<"+elem+"> in <"+xml.localName()+">");
        }

        
        static private function _errorNoElement(xml:XML, elem:String) : Error
        {
            _erroredXML = xml;
            return new Error("no <"+elem+"> in <"+xml.localName()+">");
        }
        
        
        static private function _errorAttribute(xml:XML, attr:String, err:String) : Error
        {
            _erroredXML = xml;
            return new Error("attribute:"+attr+" cannot be "+err);
        }

        
        static private function _errorNoAttribute(xml:XML, attr:String) : Error
        {
            _erroredXML = xml;
            return new Error("no attribute:"+attr+" in <"+xml.localName()+">");
        }

        
        static private function _errorSimpleOnly(xml:XML) : Error
        {
            _erroredXML = xml;
            return new Error("<"+xml.localName()+"> has simple content only.");
        }
        
        
        static private function _errorHasOnlyOne(xml:XML, only:String) : Error
        {
            _erroredXML = xml;
            return new Error("<"+xml.localName()+"> must have only one <"+only+"> in it.");
        }
    }
}




class seqinfo
{
    internal var bseq:String = "nws";
    internal var bv:String = "0";
    function seqinfo() {}
}
