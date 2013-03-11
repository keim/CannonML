//----------------------------------------------------------------------------------------------------
// CML statement class for formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLFiber;
    import org.si.cml.namespaces._cml_fiber_internal;
    
    
    /** @private statemant for formula calculation */
    internal class CMLFormula extends CMLState
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_fiber_internal;
        
        
        
        
    // variables
    //------------------------------------------------------------
        private  var _arg_index:uint = 0;
        private  var _form:CMLFormulaElem = null;
        internal var max_reference:int = 0;
        static private var stacOperator:Array = new Array();
        static private var stacOperand :Array = new Array();

        static private  var _prefixRegExp :RegExp; 
        static private  var _postfixRegExp:RegExp; 
        static private  var _operand_rex:String = null;
       
        // Initialize all statics (call from CMLParser._createCMLRegExp())
        static internal function get operand_rex() : String {
            if (_operand_rex == null) {
                _operand_rex  = "(" + CMLFormulaOperator.prefix_rex + "+)?"
                _operand_rex += CMLFormulaLiteral.literal_rex + "?";
                _operand_rex += "(" + CMLFormulaOperator.postfix_rex + "+)?";
                _prefixRegExp  = new RegExp(CMLFormulaOperator.prefix_rex, 'g');
                _postfixRegExp = new RegExp(CMLFormulaOperator.postfix_rex, 'g');
                // NOTE: CMLFormulaLiteral.literal_rex is a property.
            }
            return _operand_rex;
        }
        
        
        
        
    // functions
    //------------------------------------------------------------
        function CMLFormula(state:CMLState, pnfa:Boolean)
        {
            super(ST_FORMULA);
            
            jump = state;
            func = _calc;
            _arg_index = state._args.length - 1;
            stacOperator.length = 0;
            max_reference = 0;
            
            // Pickup Number From Argument ?
            if (pnfa) {
                stacOperand.length = 1;
                stacOperand[0] = new CMLFormulaLiteral();
                stacOperand[0].num = state._args[_arg_index];
            } else {
                stacOperand.length = 0;
            }
        }

        
        override protected function _setCommand(cmd:String) : CMLState
        {
            return this;
        }


        
        
    // function to create formula structure
    //------------------------------------------------------------
        // push operator stac
        internal function pushOperator(oprator:*, isSingle:Boolean) : Boolean
        {
            if (oprator == undefined) return false;
            var ope:CMLFormulaOperator = new CMLFormulaOperator(oprator, isSingle);
            while (stacOperator.length > 0 && CMLFormulaOperator(stacOperator[0]).priorL > ope.priorR) {
                var oprcnt:uint = CMLFormulaOperator(stacOperator[0]).oprcnt;
                if (stacOperand.length < oprcnt) return false;
                CMLFormulaOperator(stacOperator[0]).opr1 = (oprcnt > 1) ? (stacOperand.shift()) : (null);
                CMLFormulaOperator(stacOperator[0]).opr0 = (oprcnt > 0) ? (stacOperand.shift()) : (null);
                stacOperand.unshift(stacOperator.shift());
            }
            
            // closed by ()
            if (stacOperator.length>0 && CMLFormulaOperator(stacOperator[0]).priorL==1 && ope.priorR==1) stacOperator.shift();
            else stacOperator.unshift(ope);
            return true;
        }
        
        
        // push operand stac
        internal function pushLiteral(literal:*) : void
        {
            if (literal == undefined) return;
            var lit:CMLFormulaLiteral = new CMLFormulaLiteral();
            var ret:int = lit.parseLiteral(literal);
            if (max_reference < ret) max_reference = ret;
            stacOperand.unshift(lit);
        }

        
        // push prefix
        internal function pushPrefix(prefix:*, isSingle:Boolean) : Boolean
        {
            return (prefix != undefined) ? _parse_and_push(_prefixRegExp, prefix, isSingle) : true;
        }

        
        // push postfix
        internal function pushPostfix(postfix:*, isSingle:Boolean) : Boolean
        {
            return (postfix != undefined) ? _parse_and_push(_postfixRegExp, postfix, isSingle) : true;
        }
        
        
        // call from pushPostfix and pushPrefix.
        private function _parse_and_push(rex:RegExp, str:String, isSingle:Boolean) : Boolean
        {
            rex.lastIndex = 0;
            var res:Object = rex.exec(str);
            while (res != null) {
                if (!pushOperator(res[1], isSingle)) return false;
                res = rex.exec(str);
            }
            return true;
        }

        
        // construct formula structure
        internal function construct() : Boolean
        {
            while (stacOperator.length > 0) {
                var oprcnt:uint = CMLFormulaOperator(stacOperator[0]).oprcnt;
                if (stacOperand.length < oprcnt) return false;
                CMLFormulaOperator(stacOperator[0]).opr1 = (oprcnt > 1) ? (stacOperand.shift()) : (null);
                CMLFormulaOperator(stacOperator[0]).opr0 = (oprcnt > 0) ? (stacOperand.shift()) : (null);
                stacOperand.unshift(stacOperator.shift());
            }
            if (stacOperand.length==1) _form=stacOperand.shift();
            return (_form != null);
        }

        
        

    // calculation
    //------------------------------------------------------------
        private function _calc(fbr:CMLFiber) : Boolean
        {
            jump._args[_arg_index] = _form.calc(fbr);
            return true;
        }
    }
}


