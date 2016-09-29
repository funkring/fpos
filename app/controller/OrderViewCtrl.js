/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false, ModelUtil:false */
Ext.define('Fpos.controller.OrderViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.Config',
        'Ext.proxy.PouchDBUtil',
        'Fpos.view.OrderView',
        'Fpos.view.OrderLineFormView',
        'Fpos.view.OrderFormView',
        'Fpos.view.ScaleView',
        'Ext.util.BarcodeScanner',
        'Ext.data.ModelUtil'
    ],
    config: {
        refs: {
            orderView: '#orderView',
            posDisplay: '#posDisplayLabel',
            orderItemList: '#orderItemList',
            paymentItemList: '#paymentItemList',
            paymentPanel: '#paymentPanel',
            stateDisplay: '#posDisplayState',
            posOrderState: '#posOrderState',
            inputButtonAmount: '#inputButtonAmount',
            inputButtonDiscount: '#inputButtonDiscount',
            inputButtonPrice: '#inputButtonPrice',
            inputButtonPayment: '#inputButtonPayment',
            orderInputView: '#orderInputView',
            paymentSummary: '#paymentSummary'
        },
        control: {     
            orderView: {
                initialize: 'orderViewInitialize'
            },
            posDisplay: {
                initialize: 'posDisplayInitialize',
                release: 'onStateTap'
            },
            stateDisplay: {
                initialize: 'stateDisplayInitialize',
                release: 'onStateTap'
            },
            orderItemList: {
                initialize: 'orderItemListInitialize',
                selectionchange: 'onItemSelectionChange'
            },
            paymentItemList: {
                initialize: 'paymentItemListInitialize',
                selectionchange: 'onPaymentSelectionChange'
            },
            orderInputView: {
                activeitemchange : 'orderInputActiveItemChange' 
            },
            'button[action=inputCancel]' : {
                release: 'onInputCancelTap'
            },
            'button[action=inputModeSwitch]' : {
                release: 'onInputModeSwitch'
            },
            'button[action=inputNumber]' : {
                release: 'onInputNumber'
            },
            'button[action=editOrder]' : {
                release: 'onEditOrder'
            },
            'button[action=inputCash]' : {
                release: 'onCash'
            },
            'button[action=inputPayment]' : {
                release: 'onPayment'
            },
            'button[action=createCashState]' : {
                release: 'onCreateCashState'
            },
            'button[action=createCashReport]' : {
                release: 'onCashReport'  
            },
            'button[action=createCashUserReport]' : {
                release: 'onCashUserReport'  
            },
            'button[action=createCashAllReport]' : {
                release: 'onCashAllReport'  
            },
            'button[action=printAgain]' : {
                release: 'onPrintAgain'
            },
            'button[action=saveOrder]' :  {
                release: 'onSaveOrder'
            }     
        }
    },
    
    init: function() {
        var self = this;
                
        self.place = null;
        self.order = null;
        self.printTemplate = null;
        self.printPlaceTemplate = null;
        self.initialLoad = false;
        self.postActive = false; 
        self.tempOrder = null;
        
        self.seq = 0;
        self.cpos = 0;
        self.turnover = 0;
        self.displayDelay = Config.getDisplayDelay();
        self.lastDate = null;
        
        self.mode = '*';
        self.op = '€';
        self.op_all = false;
        self.inputSign = 1; 
        self.inputText = '';
        self.roundFactor = Math.pow(10,Config.getDecimals());
        
        self.lineStore = Ext.StoreMgr.lookup("PosLineStore");
        self.orderStore = Ext.StoreMgr.lookup("PosOrderStore");
        self.taxStore = Ext.StoreMgr.lookup("AccountTaxStore");
        self.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");
        self.paymentStore = Ext.StoreMgr.lookup("PosPaymentStore");
        self.placeStore = Ext.StoreMgr.lookup("PlaceStore");
        self.productStore = Ext.StoreMgr.lookup("ProductStore");
        
        self.displayTask = Ext.create('Ext.util.DelayedTask', function() {
            self.display();
        });
        
        self.barcodeScanner = Ext.create('Ext.util.BarcodeScanner', {
            'keyListener' : function(keycode) { self.onKeycode(keycode); },
            'barcodeListener' : function(barcode) { self.onBarcode(barcode); }
        });
    },    
    
    posDisplayInitialize: function(display) {
        display.setTpl(Ext.create('Ext.XTemplate',
           '{[futil.formatFloat(values.amount_total,Config.getDecimals())]}'
        ));
    },
    
    stateDisplayInitialize: function(display) {
        var self = this;
        display.setTpl(Ext.create('Ext.XTemplate',
           '<div class="PosOrderState">',
               '<div class="PosOrderCurrency">',
               '{[this.getOp()]}',               
               '</div>',
               '<div class="PosOrderInfo">',
                  '<div class="PosOrderInfo2">',                        
                    '{name} <tpl if="ref"> / {ref}</tpl>',
                  '</div>',
                  '<div class="PosOrderInfo1">',
                    '<tpl if="partner">',
                    '{partner.name}',
                    '</tpl>',
                  '</div>',
               '</div>',
            '</div>',
            {
                getOp: function() {
                    if ( self.op == '-' ) {
                        if ( self.op_all) return '--';
                        return '–';
                    }
                    return self.op;
                }
            }));
    },
     
    orderItemListInitialize: function(orderItemList) {
        var self = this;
        orderItemList.setItemTpl(Ext.create('Ext.XTemplate',
                '<li>',
                '<tpl if="this.hasFlag(values,\'2\')">',
                    '<div class="PosOrderIndent"></div>',
                '</tpl>',
                '<tpl if="this.hasTag(values,\'#\')">',
                    '<div class="PosOrderLineName">',
                        '{name}',
                    '</div>',                
                '<tpl else>',
                    '<tpl if="!this.hasFlag(values,\'d\') && (tag || this.hasFlag(values,\'u\'))">',
                        '<div class="PosOrderLineName">',
                            '{name}',
                        '</div>',
                        '<div class="PosOrderLinePrice">',
                             '{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]}',
                        '</div>',
                    '<tpl else>',
                        '<div class="PosOrderLineDescription">',
                            '<div class="PosOrderLineName">',
                                '{name}',
                            '</div>',                   
                            '<div class="PosOrderLineAmount">',
                                '<tpl if="qty_op == \'+\' && values.qty_diff && values.qty_diff != values.qty">',
                                    '<b>',
                                    '&nbsp;+&nbsp;',
                                    '{[this.formatAmount(values, values.qty_diff || 0.0)]}',
                                    '</b>',
                                    ' = ', 
                                '</tpl>',
                                '{[this.formatAmount(values, values.qty)]}',
                                '<tpl if="qty_op == \'-\' && values.qty_prev && values.qty_prev != values.qty">',
                                    '&nbsp;',
                                    '/',
                                    '&nbsp;',
                                    '{[this.formatAmount(values, values.qty_prev || 0.0)]}',
                                '</tpl>',
                                '&nbsp;',
                                '{[this.getUnit(values.uom_id)]}',
                                ' * ',
                                '{[futil.formatFloat(values.price,Config.getDecimals())]}&nbsp;{[Config.getCurrency()]}',
                                '<tpl if="netto">',
                                  '<tpl if="qty != 0 && qty != 1">',
                                  ' = <b>{[futil.formatFloat(values.subtotal,Config.getDecimals())]}&nbsp;{[Config.getCurrency()]}</b>',
                                  '</tpl>',
                                  '&nbsp;',
                                  '<b>NETTO</b>',
                                '</tpl>',
                                ' ',
                                '<tpl if="discount &gt; 0.0">',
                                    '<span class="PosOrderLineDiscount">',
                                    '- {[futil.formatFloat(values.discount,Config.getDecimals())]}&nbsp;%',
                                    '</span>',
                                '</tpl>',
                               
                            '</div>',                    
                        '</div>',
                        '<div class="PosOrderLinePrice">',
                            '{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]}',
                        '</div>',
                    '</tpl>', 
                '</tpl>',
                '</li>',
                {                
                    getUnit: function(uom_id) {
                        var uom = self.unitStore.getById(uom_id);
                        return uom && uom.get('name') || '';
                    },
                    
                    formatAmount: function(values, qty)  {
                        var dec = values.a_dec;
                        if ( dec < 0 ) {
                            return futil.formatFloat(qty, 0);
                        } else if ( dec > 0 ) {
                            return futil.formatFloat(qty, dec);
                        } else {
                            return futil.formatFloat(qty, Config.getQtyDecimals()); 
                        }
                    },
                    
                    hasTag: function(values, tag) {
                        if ( !tag ) {
                            return values.tag ? true : false;
                        } else if ( !values.tag ) {
                            return false;
                        } else {
                            return values.tag == tag;
                        }
                    },
                    
                    hasFlag: function(values, flag) {
                        if ( !flag) {
                            return values.flags ? true : false;
                        } else if ( !values.flags ) {
                            return false;
                        } else {
                            return values.flags.indexOf(flag) > -1;
                        }
                    },
                    
                    getOp: function() {
                        return self.op;
                    }
                    
                }
        ));        
        orderItemList.setStore(this.lineStore);
    },    

    paymentItemListInitialize: function(paymentItemList) {
        var self = this;
        paymentItemList.setItemTpl(Ext.create('Ext.XTemplate',
                '<div class="PaymentName">',
                    '{journal.name}',
                '</div>',
                '<div class="PaymentValue">',
                    '{[futil.formatFloat(values.payment)]}',
                '</div>'
        ));        
        paymentItemList.setStore(this.paymentStore);
    },
     
    orderViewInitialize: function() {
        var self = this;          
        
        // reload event
        Ext.Viewport.on({
            scope: self,
            reloadData: self.fullDataReload            
        });

        // product input event         
        Ext.Viewport.on({
            scope: self,
            productInput: self.productInput            
        });
        
        // place input
        Ext.Viewport.on({
            scope: self,
            placeInput: self.placeInput
        });    
        
        // validation event         
        Ext.Viewport.on({
            scope: self,
            validateLines: self.onValidateLines            
        });
       
        // key down event 
        Ext.Viewport.on({
            scope: self,
            posKey: self.onKeyDown
        });
        
        // user change
        Ext.Viewport.on({
            scope: self,
            userChange: self.onUserChange
        });
        
        // data changed
        Ext.Viewport.on({
           scope: self,
           syncChange: self.onChange
        });
        
        // order changed
        Ext.Viewport.on({
           scope: self,
           orderLogChanged: self.onOrderChanged 
        });
        
        // reload data
        self.reloadData();
    },
    
    updatePlace: function(place, amount, userId) {
        if ( place ) {
            if ( this.order ) {
                if ( amount === undefined ) amount = this.order.get('amount_total');
                if ( userId === undefined ) userId = this.order.get('user_id');
            } 
            if ( !amount ) amount = 0.0;
            if ( !userId ) userId = null;
            place.set('amount', amount);
            place.set('user', Config.getUserName(userId)); 
        }
    },
    
    placeInput: function(place) {
        var self = this;
        self.place = place;
        self.reloadData(function() {
            if ( self.tempOrder ) {
                var lines = self.tempOrder.line_ids;
                self.tempOrder = null;
                
                // add lines
                Ext.each(lines, function(line) {
                    self.lineStore.add(line);
                });
                
                // save
                self.validateLines(true).then(function() {
                    self.updatePlace(place);
                });
            }
        });
    },    
     
    /**
     * set new quantity
     */
    setQty: function(line, qty) {
        if ( this.op != '€' ) {
            // create prev qty
            var qty_prev = line.get('qty_prev') || 0.0;            
            var qty_op = line.get('qty_op');
            if ( qty_op !== this.op ) {
                qty_prev = line.get('qty_prev');
                if ( qty_prev === undefined ) {
                    qty_prev = line.get('qty') || 0.0;
                    line.set('qty_prev', qty_prev);
                }
                line.set('qty', qty_prev);
                line.set('qty_op', this.op);
            } 
            
            // create next qty
            var qty_next = 0.0;
            if ( this.op == '+') {
                qty_next = qty_prev + qty;
            } else if ( this.op == '-' ) {
                qty_next = qty;
            }
            
            // update qty diff and qty
            line.set('qty_diff', qty);
            line.set('qty', qty_next);
            
        } else {
            // default handling
            line.set('qty', qty);
        }
    },
    
    getQty: function(line) {
        if ( this.op != '€' ) {
            return line.get('qty_diff') || 0.0;
        } 
        return line.get('qty') || 0.0;
    },
    
    productInput: function(product) {
        var self = this;
        if ( self.isEditable() ) {
            
            var changedLine = null;
            var profile = Config.getProfile();
            
            var toWeight = product.get('to_weight');
            var noGroup = toWeight || profile.iface_nogroup || product.get('pos_nogroup') || false;
            var hideMenu = false;
        
            if ( !noGroup ) {
                self.lineStore.each(function(line) {
                    if ( line.get('product_id') === product.getId() ) {
                        self.setQty(line, self.getQty(line) + 1);
                        changedLine = line;
                        return false; //stop iteration
                    }
                });
            }
            
            if ( !changedLine ) {
                var db = Config.getDB();
                // build values
                var values = {
                    //'order_id' : self.order.getId(),
                    name : product.get('name'),
                    product_id : product.getId(),
                    uom_id : product.get('uom_id'),
                    tax_ids : product.get('taxes_id'),
                    netto : product.get('netto'),
                    price : product.get('price'),
                    qty : toWeight ? 0.0 : 1.0,
                    subtotal_incl : 0.0,
                    subtotal : 0.0,
                    discount : 0.0,
                    sequence : self.lineStore.getCount()
                };
                
                // add operation specific
                if ( self.op != '€' ) {
                    values.qty_diff = 1.0;
                    values.qty_prev = 0.0;
                    values.qty_op = self.op;
                }
                
                // determine flags
                var flags = '';
                if ( product.get('nounit') ) {
                    flags +="u";
                }
                if ( product.get('pos_minus') ) {
                    flags +="-";
                }
                if ( product.get('pos_price') ) {
                    flags +="p";
                    hideMenu = true;
                }
                var pos_sec = product.get('pos_sec');
                if ( pos_sec  ) {
                    // section 1 or 2
                    flags +=pos_sec;
                }                
                if ( flags.length > 0) {
                    values.flags = flags;
                }
                
                // amount
                var a_pre = product.get('pos_amount_pre');
                if ( a_pre > 0 || a_pre < 0 ) {
                    values.a_pre = a_pre;
                }
                var a_dec = product.get('pos_amount_dec');
                if ( a_dec > 0 || a_dec < 0 ) {
                    values.a_dec = a_dec;
                }
                
                // price
                var p_pre = product.get('pos_price_pre');
                if ( p_pre > 0 || p_pre < 0 ) {
                    values.p_pre = p_pre;
                }
                var p_dec = product.get('pos_price_dec');
                if ( p_dec > 0 || p_dec < 0 ) {
                    values.p_dec = p_dec;
                }
                
                // set tag to other if is an income or expense
                if ( product.get('expense_pdt') ) {
                    values.tag = "o";
                    hideMenu = true;
                } else if ( product.get('income_pdt') ) {
                    values.tag = "i";
                    hideMenu = true;
                } else if ( product.get('pos_cm' ) ) {
                    values.tag = "#";
                }  else if ( values.tag ) {
                    values.tag = null;
                }
                
                // add line
                changedLine = self.lineStore.add(values)[0];
                if ( changedLine ) {
                    changedLine.dirty = true;
                }
                
                // hide menu
                if ( hideMenu ) {
                    ViewManager.hideMenus();
                }
            }
            
            // validate lines
            self.validateLines().then(function() {
                self.getOrderItemList().select(changedLine);
                //self.setDefaultItemMode(changedLine);
            });
            
            // show weight dialog
            if ( toWeight && changedLine && Config.hasScale() ) {
                if ( !self.scaleInput ) {
                    self.scaleInput = Ext.create('Fpos.view.ScaleView',{      
                        hideOnMaskTap: true,
                        modal: true,
                        centered : true                
                    });
                    Ext.Viewport.add( self.scaleInput );
                } else {
                    self.scaleInput.show();
                }
                
                // start scale
                self.scaleInput.setRecord(changedLine);
                self.scaleInput.startScale();
            }
        }
    },
    
    /**
     * handle change event
     */
    onChange: function(info) {
        var self = this;
        if ( info.direction == 'pull' ) {    
            if ( info.change && info.change.docs ) {
                Ext.each(info.change.docs, function(doc) {
                    if ( doc.fdoo__ir_model == 'fpos.order' ) {
                        // check if it is a place                        
                        if ( doc.place_id ) {
                            // set the new place amount
                            var place = self.placeStore.getPlaceById(doc.place_id);        
                            if ( place ) {
                                if ( doc._deleted ) {
                                    self.updatePlace(place, 0.0);
                                } else {
                                    self.updatePlace(place, doc.amount_total, doc.user_id);
                                }
                            }
                        }
                        
                        // reload data if data is the same
                        // as current selected            
                        if ( self.order && self.order.getId() == doc._id ) {
                            if ( doc._deleted ) {
                                 if ( Config.getProfile().iface_place ) {
                                    Ext.Viewport.fireEvent("showPlace");
                                 } else {
                                     self.nextOrder();
                                 }                                     
                            } else {
                                self.reloadData();
                            }    
                        } 
                    }
                });
            }     
        } 
    },
    
    /**
     * change operation mode
     */
    onStateTap: function() {
        var self = this;
        if ( !self.isEditable() || !self.place ) return;
        self.order.reject();        
        switch ( self.op ) {
            case '€' :
                ViewManager.startLoading("BONIER Modus..."); 
                self.reloadData(function() {
                    ViewManager.stopLoading();                     
                }, '+');
                break;
            case '+' : 
                ViewManager.startLoading("SPLIT Modus...");
                self.reloadData(function() {
                   ViewManager.stopLoading(); 
                }, '-');
                break;
            case '-' :
                if ( self.op_all ) {
                    ViewManager.startLoading("GESAMT Modus...");
                    self.reloadData(function() {
                       ViewManager.stopLoading();
                    }, '€');
                } else {
                    ViewManager.startLoading("GESAMT SPLIT Modus...");
                    self.op_all = true;
                    // select all
                    self.lineStore.each(function(line) {
                        var qty = line.get('qty_prev') || 0.0;
                        line.set('qty', qty);                        
                        line.set('qty_diff', qty);
                    });                    
                    // validate
                    self.validateLines().then(function() {
                        ViewManager.stopLoading();
                    });
                }
                break;
        }
    },
    
    // save order
    onSaveOrder: function() {
        var self = this;
        if ( !self.isEditable() ) return;
        
        ViewManager.hideMenus();
         
        var place_id = self.order.get('place_id');
        var place = place_id ? self.placeStore.getPlaceById(place_id) : null;

        if ( place ) {
            // create temp order            
            if ( self.op == '-' ) {
                var db = Config.getDB();
                if ( !self.tempOrder ) {
                    self.tempOrder = ModelUtil.createDocument(self.order);
                    self.tempOrder.place_id = null;
                    self.tempOrder.tag = 't';
                    self.tempOrder.line_ids = [];
                    self.tempOrder.tax_ids = [];
                    self.tempOrder.state = 'draft';
                    self.tempOrder.amount_tax = 0.0;
                    self.tempOrder.amount_total = 0.0;
                }
                
                self.lineStore.each(function(line) {
                    // add to temp if diff not null
                    var qty_diff = line.get('qty_diff');
                    if ( qty_diff > 0.0 ) {
                        self.tempOrder.line_ids.push(ModelUtil.createDocument(line));
                    }
                    
                    // calc new quantity
                    var qty_prev = line.get('qty_prev') || 0.0;
                    var qty_after = qty_prev - qty_diff;
                    if ( qty_after > 0.0 ) {
                        line.set('qty', qty_after);
                    } else {
                        // or remove
                        self.lineStore.remove(line);
                    }                                  
                });                
            } 
                        
            // save order            
            self.validateLines(true, Config.hasPrinters() && place)['catch'](function(err) {
                ViewManager.handleError(err, {name:'Fehler', message:'Bestellung konnte nicht boniert werden'});
            }).then(function(){
                // show places
                Ext.Viewport.fireEvent("showPlace");
                self.updatePlace(place);                                
            });       
        }
    },
    
    // print place order
    onOrderChanged: function(order) {
        this.printPlaceOrder(order);
    },
    
    round: function(val) {
        return Math.round(val*this.roundFactor) / this.roundFactor;  
    },
    
    // compute line values
    validateLine: function(line, taxes, taxlist) {
       var price, total, total_netto, netto;
       
       var self = this;
       
       var discount = line.get('discount') || 0.0;
       discount = 1.0 - (discount/100.0);
       
       var qty = line.get('qty') || 0.0;
       var tax_ids = line.get('tax_ids');

       if ( !taxes ) 
            taxes = {};
        
       var tax_percent = 0.0;
       var tax_fixed = 0.0;
       var total_tax = 0.0;
     
        
       Ext.each(tax_ids, function(tax_id) {
            var tax = taxes[tax_id];
            if ( !tax ) {
                var taxDef = self.taxStore.getById(tax_id);
                if ( taxDef ) {
                    var taxsum = {
                        fdoo__ir_model: 'fpos.order.tax',
                        tax_id : tax_id,                    
                        name : taxDef.get('name'), 
                        amount_tax : 0.0,
                        amount_netto : 0.0
                    };
                    
                    if (taxlist)
                        taxlist.push(taxsum);
                    
                    tax = {                    
                        type : taxDef.get('type'),
                        amount : taxDef.get('amount'),
                        sum : taxsum                    
                    };
                    taxes[tax_id] = tax;
                }
            }
            
            if ( tax ) {
                if (tax.type === 'percent') {
                    tax_percent += tax.amount;
                } else if (tax.type === 'fixed') {
                    tax_fixed += (tax.amount * qty);
                }                  
           }
        });
               
        // calc total
        netto = line.get('netto');
        price = line.get('price') || 0.0;
        if ( netto ) {
            total_netto =  qty * price * discount;
            total = self.round((total_netto+tax_fixed) * (1.0 + tax_percent));
        } else {     
            total = qty * price * discount;   
            total_netto = (total-tax_fixed) / (1.0 + tax_percent);
        }

        // sum tax
        Ext.each(tax_ids, function(tax_id) {
            var tax = taxes[tax_id];
            var amount_tax = 0.0;       
            if (tax.type === 'percent') {
                amount_tax = (total_netto * (1.0 + tax.amount)) - total_netto;
            } else if (tax.type === 'fixed') {
                amount_tax = (tax.amount * qty);
            }   
            
            // netto do rounding
            if ( netto ) {
                amount_tax = self.round(amount_tax);
            }
                
            tax.sum.amount_tax += amount_tax;
            tax.sum.amount_netto += total_netto;
            total_tax += amount_tax;
        });
        
        // set subtotal if dirty
        if ( line.get('subtotal_incl') != total ) {            
            line.set('subtotal_incl', total);
            line.set('subtotal', total_netto);
        }
        
        // return subtotal brutto and amount tax
        return { subtotal_incl: total, 
                 amount_tax:  total_tax };
    },
    
    // validate lines of current order
    validateLines: function(forceSave, storeLog) {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        // primary check
        if ( (!self.postActive || forceSave) && self.order && self.order.get('state') === 'draft') {
                       
            var tax_group = {};
            var tax_ids = [];
            
            // compute lines
            var amount_total = 0.0;
            var amount_tax = 0.0;
            var turnover = 0.0;
            var lines = [];
            var updateLines = false;
            
            self.lineStore.each(function(line) {                
                var total_line = self.validateLine(line, tax_group, tax_ids);
                var tag = line.get('tag');
                if ( !tag ) {
                    // add                
                    amount_total += total_line.subtotal_incl;
                    amount_tax += total_line.amount_tax;
                    turnover += total_line.subtotal_incl;
                } else if ( tag == 'r' || tag == 'o' || tag == 'i') {
                    // add balance and other
                    amount_total += total_line.subtotal_incl;
                    amount_tax += total_line.amount_tax;
                } else if ( tag == 'b' ) {
                    // substract real balance
                    amount_total -= total_line.subtotal_incl;
                    amount_tax -= total_line.amount_tax;
                }                
                
                // add line                
                if ( line.dirty ) {
                    updateLines = true;
                    line.commit();
                }
                
                // create doc
                var doc = ModelUtil.createDocument(line, null, !forceSave);
                lines.push(doc);
            });
            
            // round
            amount_total = self.round(amount_total);
            amount_tax = self.round(amount_tax);
            
            // set values
            self.order.set('tax_ids', tax_ids);
            self.order.set('amount_tax', amount_tax);
            self.order.set('amount_total', amount_total);
            self.order.set('turnover', turnover);
            if ( updateLines || forceSave ) {
                self.order.set('line_ids', lines);
            } else {
                // check if line count has changed
                var curLines = self.order.get('line_ids');
                if ( !curLines || curLines.length != lines.length ) {
                    self.order.set('line_ids', lines);
                }                               
            }
            
            // notify display update
            self.displayTask.delay(self.displayDelay);

            // create log
            var orderLogChanged = false;
            if ( storeLog ) {   
                // check if there exist old lines, if it is a new 
                // order don't store log
                var oldLines = self.order.raw.line_ids;                
                var logs = self.order.get("log_ids");
                var logLines = [];
                if ( (oldLines && oldLines.length > 0) || (logs && logs.length > 0) ) {
                    
                    // diff function
                    var createDiff = function(line, oldLine) {
                        var qty = (line && line.qty || 0.0) - (oldLine && oldLine.qty || 0.0);
                        
                        // get val
                        var get = function(prop) {
                            return (line && line[prop]) || (oldLine && oldLine[prop]) || null;                            
                        }; 
                        
                        if ( qty ) {
                            var logEntry = {
                                product_id: get('product_id'),
                                uom_id: get('uom_id'),
                                name: get('name'),
                                notice: get('notice'),
                                tag: get('tag'),
                                qty : qty
                            };
                            
                            // copy val
                            var copy = function(prop) {
                                var val = get(prop);
                                if (val) logEntry[prop] = val;
                            };
                            
                            // copy vals
                            copy('flags');
                            copy('a_pre');
                            copy('a_dec');
                            copy('p_pre');
                            copy('p_dec');
                            
                            logLines.push(logEntry);
                        }
                    };
                    
                    // build old line dict
                    var oldLinesDict = {};
                    Ext.each(oldLines, function(line) {
                       oldLinesDict[line._id] = line; 
                    });
                    
                    // build new line dict
                    var newLinesDict = {};
                    Ext.each(lines, function(line) {
                       newLinesDict[line._id] = line;
                       var oldLine = oldLinesDict[line._id];
                       createDiff(line, oldLine);
                    });                   
                    
                    // check removed
                    Ext.each(oldLines, function(line) {
                       var newLine = newLinesDict[line._id];
                       if ( !newLine ) {
                            createDiff(newLine, line);
                       }
                    });                 
                } else {
                    orderLogChanged = true;
                }
                
                // create log entries
                if ( logLines.length > 0) {
                    orderLogChanged = true;
                    var date = futil.datetimeToStr(new Date());
                    var log = {
                        date: date,
                        user_id : Config.getUser()._id,
                        fpos_user_id : Config.getProfile().user_id,
                        line_ids : logLines                        
                    };
                    if ( logs ) {
                        self.order.set("log_ids", logs.concat([log]));                        
                    } else {
                        self.order.set("log_ids", [log]);
                    }                    
                }
            }
            
            // save
            // ( only save if it is dirty, not places are active or force save was passed)            
            if ( self.order.dirty && (!Config.getProfile().iface_place || forceSave)) {
                self.order.save({
                    callback: function() {
                        // send changed event                        
                        if ( orderLogChanged && self.op !== '-' ) {
                            Ext.Viewport.fireEvent("orderLogChanged", self.order.getData());
                        }                      
                        deferred.resolve();
                    }
                });                
            } else {
                setTimeout(function() {
                    deferred.resolve();
                }, 0);
            }
            
        } else {
            setTimeout(function() {
                deferred.resolve();
            }, 0);
        }
        
        return deferred.promise();
    },
    
    // set current order
    setOrder: function(order) {
        var self = this;
        self.order = order;

        // reset of display
        // when new order (only in place mode)
        if ( Config.getProfile().iface_place ) {
            self.getPosDisplay().setRecord(null);
            self.getStateDisplay().setRecord(null);        
        }
        
        // reset view
        self.setMode("*");
        self.resetView();
        
        // set record        
        self.getPosDisplay().setRecord(order);
        self.getStateDisplay().setRecord(order);
        self.getOrderItemList().deselectAll(true);
        
        // get lines
        var lines = null;
        if ( order ) {
            lines = order.get('line_ids');
        }
        
        // update lines        
        if ( lines ) {
            self.lineStore.setData(lines);
        } else {
            self.lineStore.setData([]);
        }    
        
        // reset qty
        if ( self.op == '-') {
            self.lineStore.each(function(line) {
                self.setQty(line,0.0);       
            });
        }  
    },
    
    // set order defaults
    setOrderDefaults: function(order) {
         var date = futil.datetimeToStr(new Date());
         order.fdoo__ir_model = 'fpos.order';
         order.fpos_user_id = Config.getProfile().user_id;
         order.user_id = Config.getUser()._id;
         order.state = 'draft';
         order.date = date;
         order.tax_ids = [];
         order.line_ids = [];
         order.amount_tax = 0.0;
         order.amount_total = 0.0;
         return order;
    },
    
    // create new order
    nextOrder: function(callback) {
        var self = this;
        
        var db = Config.getDB();
        var user = Config.getUser();
        var profile = Config.getProfile();
                
        if ( user && profile) {
            var values = self.setOrderDefaults({});
            if ( self.place ) {
                values.place_id = self.place.getId();
            }
            
            db.post(values).then(function(res) {
                // set order
                self.orderStore.getProxy().readDocument(res.id, function(err, order) {
                    self.setOrder(order || null);
                    if (callback) callback();
                }); 
            });
        } else if ( callback ) {
            callback();
        }
    },
    
    setMode: function(mode, sign) {    
        var self = this;    
        // set mode    
        self.mode = mode;
        
        // update text input
        this.inputText = '';        
        if (sign >= 0) {
            this.inputSign = 1; 
        } else if (sign < 0) {
            this.inputSign = -1;
        }
        
        // validate buttons
        Ext.each([self.getInputButtonAmount(),
                  self.getInputButtonDiscount(),
                  self.getInputButtonPrice()],
                 function(button) {
                    if ( button ) {
                        if ( button.getText() == self.mode ) {
                            button.setUi('posInputButtonGray');
                        } else {
                            button.setUi('posInputButtonBlack');
                        }
                    }                      
                 });        
    },   
    
    orderInputActiveItemChange: function(view, newCard) {
        var self = this;
        var paymentButton = self.getInputButtonPayment();
        if ( newCard == self.getPaymentPanel()  ) {
            if ( paymentButton ) {
                paymentButton.setUi('posInputButtonGray');
            }
        } else {
            if ( paymentButton ) { 
                paymentButton.setUi('posInputButtonOrange');
            }
        }        
    },
      
    resetView: function() {
        // reset current view 
        var self = this;      
        var orderItemList = self.getOrderItemList();
        var inputView = self.getOrderInputView(); 
        if ( inputView.getActiveItem() != orderItemList ) {
            inputView.setActiveItem(orderItemList);
        }
    },
    
    fullDataReload: function(callback, op) {
        var self = this;
        
        self.initialLoad = true;
        self.printTemplate = null;
        self.printPlaceTemplate = null;
        self.place = null;
        
        self.seq = 0;
        self.cpos = 0;
        self.turnover = 0;

        // check callback
        if ( !callback ) {        
            ViewManager.startLoading("Lade...");
            callback = function() {
                 ViewManager.stopLoading();
            };
        }

        if ( Config.getProfile().iface_place ) {
           // load open orders
           var db = Config.getDB();           
           
           // set active
           DBUtil.search(db, [['fdoo__ir_model','=','fpos.order'],['state','=','draft']], {'include_docs':true}).then(function(res) {
               Ext.each(res.rows, function(row) {
                  var place = self.placeStore.getPlaceById(row.doc.place_id);
                  self.updatePlace(place, row.doc.amount_total, row.doc.user_id);
               });
               self.reloadData(callback, op);
           });
        } else {       
          // default reload
          self.reloadData(callback, op);
        }
    },
        
    reloadData: function(callback, op) {
        if ( !this.initialLoad ) {
            this.fullDataReload(callback, op);
        } else {
            var self = this;
            
            var db = Config.getDB();
            var user = Config.getUser();
            
            // set default operation
            self.op = '€';
            self.op_all = false;
            
            // load if valid user and not places are activ or places are active 
            // and a valid place exist
            if ( user ) {
                var params = null;
                if ( self.place ) {
                    // change operation
                    if ( op ) {
                        self.op = op;
                    } else {
                        // default operation
                        self.op = '+';                        
                    }
                    params =  {
                        domain : [['state','=','draft'],['place_id','=',self.place.getId()]]
                    };
                } else {
                    params =  {
                        domain : [['state','=','draft'],['user_id','=',user._id]]
                    };
                }
                        
                var options = {
                    params : params, 
                    callback: function() {
                        if ( self.orderStore.getCount() === 0 ) {
                            // create new order
                            self.nextOrder(callback);
                        } else {
                            // set current order                            
                            self.setOrder(self.orderStore.last());
                            
                            // callback
                            if (callback) callback();
                        }
                    }
                };
                self.orderStore.load(options);
            } else {
                // load nothing
                self.orderStore.setData([]);
                self.setOrder(null);
                
                // callback
                if ( callback ) callback();
            }  
        }      
    },
    
    onUserChange: function(user) {
        if ( this.order && this.order.get('user_id') != user._id ) {
            this.reloadData();
        }
    },
    
    isDraft: function() {
        return this.order && this.order.get('state') == 'draft';
    },
    
    isPayment: function() {
        return this.getOrderInputView().getActiveItem() == this.getPaymentPanel();
    },
    
    isEditable: function() {
        return this.isDraft() && !this.isPayment();
    },
    
    onValidateLines: function() {
        if ( this.isEditable() ) {
            this.validateLines();
        }  
    },
    
    onInputCancelTap: function() {
        if ( !this.isDraft ) return;
    
        var self = this;
        self.inputText = '';    
        
        // default editing
        if ( !self.isPayment() ) {
            var records = self.getOrderItemList().getSelection();
            if ( records.length > 0  ) {
                var record = records[0];
                var tag = record.get("tag");
                if ( !tag || tag == 'o' ||  tag == 'i' || tag == 'r') {
                    // reset price price
                    if ( self.mode == "€" ) {
                        var db = Config.getDB();
                        var product_id = record.get('product_id');
                        if ( product_id ) {
                            db.get(product_id).then(function(doc) {
                                // delete or reset price
                                if ( record.get('price') === doc.price) {
                                   self.lineStore.remove(record);
                                } else {
                                   record.set('price',doc.price);
                                }
                                self.validateLines();   
                            })['catch'](function(err) {
                                ViewManager.handleError(err, {name:'Fehler', error: 'Produkt kann nicht zurückgesetzt werden'});
                            });              
                        } else {
                            record.set('price',0.0);
                            self.validateLines();       
                        }
                    } else {
                        // reset quantity
                        if ( self.mode == "*") {
                            if ( self.getQty(record) === 0.0 ) {
                                if ( !tag || tag != 'r' ) {
                                    self.lineStore.remove(record);
                                } else {
                                    self.setQty(record, 1.0);
                                }
                            } else {
                                self.setQty(record, 1.0);
                                if ( tag == 'o' || tag == 'i' || tag == 'r' ) {
                                    self.setQty(record, 1.0);                                    
                                } else {
                                    self.setQty(record, 0.0);
                                }
                            }
                        // reset discount
                        } else if ( self.mode == "%") {
                            record.set('discount',0.0);
                        }                         
                        self.validateLines();
                    }
                } else if ( tag == '#' ) {
                    self.lineStore.remove(record);
                    self.validateLines();
                } 
            }           
        } else {
            // handle payment
            var payments = self.getPaymentItemList().getSelection();
            if ( payments.length > 0  ) {            
               var payment = payments[0];
               payment.set('payment',0.0);
               self.validatePayment();
            }
        }
    },
    
    getInputTextFromLine: function(line) {
        if ( this.mode == "%") {
            return futil.formatFloat(line.get('discount'), Config.getDecimals());
        } else if ( this.mode == "€") {
            return futil.formatFloat(line.get('price'), Config.getDecimals());
        } else {
            return futil.formatFloat(line.get('qty'), Config.getQtyDecimals());
        }
    },
        
    inputAction: function(action) {
        // allow only editing if draft
        if ( !this.isDraft() ) return;
        
        var valid = true;   
        var commaPos, decimals, value;        
        if ( !this.isPayment()  ) {
            
            var lines = this.getOrderItemList().getSelection();
            if ( lines.length > 0  ) {            
                var line = lines[0];
                var tag = line.get('tag');    
                  
                var a_pre = line.get('a_pre');
                var a_dec = line.get('a_dec');
                var p_pre = line.get('p_pre');
                var p_dec = line.get('p_dec');
                var flags = line.get('flags');

                var max_a_dec = Config.getQtyDecimals();
                if ( a_dec < 0 || a_dec > 0) {
                    max_a_dec = Math.min(a_dec, max_a_dec);
                }
                
                var max_p_dec = Config.getDecimals();
                if ( p_dec < 0 || p_dec > 0) {
                    max_p_dec = Math.min(p_dec, max_p_dec);
                }
                
                var nounit = false;
                var minus = false;
                if (flags) {
                    minus = flags.indexOf('-') > -1;
                    nounit = flags.indexOf('u') > -1;
                }
                       
                if ( !tag || tag == 'r' || tag == 'o' || tag == 'i') {
                
                    // set mode to €
                    // if it is real balance input
                    // if it is other
                    if ( tag == 'r' || tag == 'o' || tag == 'i' || nounit) {
                        if ( this.mode != '€' ) {
                            this.setMode('€');
                        }
                        // check input sign
                        if ( ( tag == 'o' || (minus && this.inputText.length === 0) ) && this.inputSign !== -1 ) {
                            this.inputSign = -1;
                        }
                    }
                    
                    // switch sign
                    if ( action == "+/-" ) {
                        if ( this.mode == "*"  || this.mode == "€") {
                            // special case, only switch sign
                            if ( this.inputText.length === 0 ) {
                                if ( this.mode == "*" ) {
                                    this.setQty(line, this.getQty(line)*-1);
                                } else {
                                    line.set('price', line.get('price')*-1);
                                }
                                this.validateLines();
                                valid = false;
                            } else {
                                this.inputSign*=-1;
                            }
                        } else {
                            valid = false;
                        }
                    // add comma
                    } else if ( action == "." ) {
                        if ( this.mode == '*' && a_dec < 0 ) {
                            valid = false;
                        } else if ( this.mode == '€' && p_dec < 0) {
                            valid = false;
                        } else if ( this.inputText.indexOf(".") < 0 ) {                            
                            this.inputText += "."; 
                        } else {
                            valid = false;
                        }
                    // default number handling
                    } else {
                        commaPos = this.inputText.indexOf(".");
                        if ( commaPos >= 0 ) { 
                            decimals = this.inputText.length - commaPos; 
                            if ( this.mode == '*' ) {
                                // only add if less than max qty decimals
                                if ( decimals > max_a_dec ) {
                                    valid = false;
                                }
                            // only add if less than max decimals
                            } else if ( this.mode == '€' ) {
                                // only add if less than max price decimals
                                if ( decimals > max_p_dec ) {
                                    valid = false;
                                }
                            // default check decimals
                            } else if ( decimals > Config.getDecimals() )  {
                                valid = false;
                            }
                        } else {
                            // fixed comma
                            if ( this.mode == '*' ) {
                               if ( a_pre < 0 || (a_pre > 0 && this.inputText.length == a_pre) ) {
                                 this.inputText += ".";
                               } 
                            } else if ( this.mode == '€' ) {
                               if ( p_pre < 0 || (p_pre > 0 && this.inputText.length == p_pre ) ) {
                                 this.inputText += ".";
                               }
                            }
                        }
                                                                        
                        //add if valid
                        if ( valid ) {
                            this.inputText += action;                            
                        }            
                    }
                  
                    // update if valid
                    if ( valid ) {
                        // update
                        value = parseFloat(this.inputText);
                        if ( this.mode == "€" ) {
                            line.set('price', value*this.inputSign);
                        } else if ( this.mode == "%" ) {
                            line.set('discount', value);
                        } else {
                            this.setQty(line, value*this.inputSign);
                        }
                        this.validateLines();
                    }
                }
            }
            
        } else {
            var payments = this.getPaymentItemList().getSelection();
            if ( payments.length > 0  ) {            
                var payment = payments[0];
                
                // switch sign
                if ( action == "+/-" ) {
                    if ( this.inputText.length === 0 ) {
                        payment.set('payment',payment.get('payment')*-1);
                        this.validatePayment();
                        valid = false;
                    } else {
                        this.inputSign*=-1;
                    }
                // add comma
                } else if ( action == "." ) {
                    if ( this.inputText.indexOf(".") < 0 ) {
                        this.inputText += "."; 
                    } else {
                        valid = false;
                    }
                // default number handling
                } else {
                    commaPos = this.inputText.indexOf(".");
                    if ( commaPos >= 0 ) { 
                        decimals = this.inputText.length - commaPos; 
                        if ( decimals > Config.getDecimals() ) {
                            valid = false;
                        }                        
                    }                    
                    //add if valid
                    if ( valid ) 
                        this.inputText += action;            
                }
              
                // update if valid
                if ( valid ) {
                    // update
                    value = parseFloat(this.inputText);
                    payment.set('payment', value*this.inputSign);
                    this.validatePayment();
                }
            }
        }
    },
    
    onInputModeSwitch: function(button) {
        this.setMode(button.getText(), 1);
    },
    
    onInputNumber: function(button) {
        this.inputAction(button.getText());
    },
    
    setDefaultItemMode: function(line) {
        if ( !line ) {
            var lines = this.getOrderItemList().getSelection();
            if ( lines.length > 0  ) {
                line = lines[0];
            }
        }
        if ( line  ) {
            var flags = line.get('flags');
            var sign = flags && flags.indexOf('-') > -1 ? -1 : 1;
            var tag = line.get('tag');            
            if ( tag == 'r' || tag == 'o' || tag == 'i' || ( flags && (flags.indexOf('u') > -1 || flags.indexOf('p') > -1) ) ) {
                var price = line.get('price');              
                if ( price < 0 ) {
                    sign = -1;
                } else if ( price > 0) {
                    sign = 1;
                }
                this.setMode('€', sign);                
            } else {
                var qty = this.getQty(line);
                if ( qty < 0 ) {
                    sign = -1;                    
                } else if (qty > 0) {
                    sign = 1;                   
                }
                this.setMode('*', sign);
            }
        } else {
            this.setMode('*');    
        }
    },
    
    setDefaultPaymentMode: function() {
        var total = this.order.get('amount_total');
        if ( total < 0 ) {
            this.setMode('*',-1);
        } else {
            this.setMode('*');
        }
    },
    
    onItemSelectionChange: function() {
       this.setDefaultItemMode();
    },
    
    onPaymentSelectionChange: function() {
        if ( !this.isDraft() || !this.isPayment() ) return;
        
        var self = this;
        var payments = this.getPaymentItemList().getSelection();
        if ( payments.length > 0  ) {            
            var payment = payments[0];
            var journal = payment.get('journal');
            
            // get total and amounts
            var total = self.order.get('amount_total');
            var orderPayments = self.order.get('payment_ids');
            var fullPaymentJournalId = null;
            var otherPayment = 0.0;
            Ext.each(orderPayments, function(orderPayment) {
                if ( orderPayment.journal_id != journal._id ) {
                    otherPayment += orderPayment.payment;
                    // check full payment
                    if ( orderPayment.amount == total ) {
                        fullPaymentJournalId = orderPayment.journal_id;
                    }
                }
                
            });
                        
            // search full payment data
            var fullPayment = null;
            if ( fullPaymentJournalId ) {
                self.paymentStore.each(function(data) {                    
                    if ( data.get('journal')._id == fullPaymentJournalId ) {
                        fullPayment = data; 
                        return false;
                    }
                });
            }
            
            // set total amount to other payment method
            if ( fullPayment ) {
                payment.set("payment", total);
                fullPayment.set("payment", 0.0);
                self.validatePayment();
            // check if there is an rest
            } else if ( otherPayment < total ) {
                payment.set("payment", total-otherPayment);
                self.validatePayment();
            }
        }
        self.setDefaultPaymentMode();
    },
    
    onEditOrder: function() {
        if ( !this.isDraft() ) return;                
        ViewManager.hideMenus();
        
        var self = this;
        var lines = self.getOrderItemList().getSelection();
        var form;
        if ( lines.length > 0 && !lines[0].get('tag')) {    
            var option = {'title' : 'Position'};
            form = Ext.create("Fpos.view.OrderLineFormView", {'title' : 'Position',
                                                              'listeners' : {
                                                                  'show' : function() {
                                                                       var textfield = this.down('textfield');
                                                                       if ( textfield ) {
                                                                            textfield.focus();
                                                                       }
                                                                  }
                                                              }});
            form.setRecord(lines[0]);
        } else {
            form =  Ext.create("Fpos.view.OrderFormView", {'title' : 'Verkauf',
                                                           'listeners' : {
                                                                  'show' : function() {
                                                                       var textfield = this.down('textfield');
                                                                       if ( textfield ) {
                                                                            textfield.focus();
                                                                       }
                                                                  }
                                                              } 
                                                            });
            form.setRecord(this.order);
        }
        
        if ( form ) {
            if ( self.order.get('state') != 'draft') 
                form.setDisabled(true);                
            Ext.Viewport.fireEvent("showForm", form); 
        }
    },
    
    /**
     * Posting the order.
     *
     * BE CAREFUL, the function only my be called 
     * once for an order.
     */
    postOrder: function() {        
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        
        var db = Config.getDB();
        var profile = Config.getProfile();
        var hasSeq = false;

        var place_id = self.order.get('place_id');

        self.validateLines(true, Config.hasPrinters() && place_id)['catch'](function(err) {
            deferred.reject(err);
        }).then(function(){
            
            // write order
            var writeOrder = function(seq, turnover, cpos) {
                // init vars
                if ( !cpos ) cpos = 0.0;
                if ( !turnover ) turnover = 0.0; 
                var cashJournalId = Config.getCashJournal()._id;
                
                // add cash payment if no payment
                var payment_ids = self.order.get('payment_ids');                
                if ( !payment_ids || payment_ids.length === 0 || !self.isPayment() ) {
                    var amount_total = self.order.get('amount_total');
                    payment_ids = [
                        {
                            journal_id : cashJournalId,
                            amount : amount_total,
                            payment : amount_total                     
                        }
                    ];
                    self.order.set('payment_ids',payment_ids);
                }
                
                // determine cpos     
                var fixed_payments = [];         
                Ext.each(payment_ids, function(payment) {
                    if ( payment.journal_id == cashJournalId ) {
                        cpos += payment.amount;
                        fixed_payments.push(payment);
                    } else if ( payment.amount !== 0 || payment.payment !== 0) {
                        fixed_payments.push(payment);
                    }
                });
                
                // write order                
                var date = futil.datetimeToStr(new Date());
                var lastDate = self.lastDate;
                if ( !lastDate ) {
                    lastDate = Config.getProfile().last_date;
                    if ( !lastDate ) {
                        lastDate = "2001-01-01 00:00:00";
                    }
                }
                
                // check last date
                if ( date < lastDate ) {
                    deferred.reject({name: 'wrong_date', message: 'Datum und/oder Uhrzeit ist auf der Kasse falsch eingestellt!'});    
                } else {
                
                    self.order.set('payment_ids',fixed_payments);
                    self.order.set('date', date);
                    self.order.set('seq', seq);
                    self.order.set('name', Config.formatSeq(seq));
                    self.order.set('state','paid');
                    
                    // turnover
                    self.order.set('turnover',self.round(self.order.get('turnover')+turnover));
                    // cpos
                    self.order.set('cpos', self.round(cpos));
                  
                    // update counters
                    var updateCounters = function() {
                        self.seq = self.order.get('seq');
                        self.turnover = self.order.get('turnover');
                        self.cpos = self.order.get('cpos');
                        self.lastDate = self.order.get('date');
                    };
                  
                    if ( Config.getSync() && place_id ) {
                        // special handling if sync
                        var orderCopy = ModelUtil.createDocument(self.order);
                        // set/override basic data
                        orderCopy.fdoo__ir_model = 'fpos.order';
                        orderCopy.fpos_user_id = Config.getProfile().user_id;
                        orderCopy.user_id = Config.getUser()._id;
                        
                        db.post(orderCopy).then(function() {
                            updateCounters();
                            orderCopy.partner = self.order.get('partner');
                            // reject order
                            self.order.reject();
                            // erase order                        
                            self.order.erase({
                                callback: function(op) {                                
                                    deferred.resolve(orderCopy);                                  
                                }
                            });                     
                        })['catch'](function(err) {
                            deferred.reject(err);
                        });
                           
                    } else {
                                   
                        // save
                        self.order.save({
                            callback: function() {
                                updateCounters();
                                deferred.resolve(self.order.getData());   
                            }
                        });
                    }                    
                }
            };
            
            
            try {
                // check for cached sequence
                if ( self.seq > 0 ) {
                    writeOrder(self.seq+1, self.turnover, self.cpos);
                } else {
                    // query last order
                    Config.queryLastOrder()['catch'](function(err) {
                        deferred.reject(err);
                    }).then(function(res) {
                        // write order
                        if ( res.rows.length === 0 ) {
                            writeOrder(profile.last_seq+1, profile.last_turnover, profile.last_cpos);
                        } else {
                            var lastOrder = res.rows[0].doc;
                            writeOrder(lastOrder.seq+1, lastOrder.turnover, lastOrder.cpos);
                        }
                    });
                }
            } catch (err) {
                deferred.reject(err);                 
            }
        });    

        return deferred.promise();      
    },
    
    onCash: function() {
        ViewManager.hideMenus();
        var self = this;
        
        if ( !self.postActive && self.isDraft() && (!self.isPayment() || self.validatePayment()) ) {
            // CHECK THAT 
            // ONLY CALLED ONCE
            ViewManager.startLoading("Drucken...");
            
            // post active
            self.postActive = true;
            var reload = false;
           
            // add payment
            // and print
            var postOrder = function() {
                self.postOrder()['catch'](function(err) {
                    // post finished
                    self.postActive = false;
                    
                    // stop loading after error
                    ViewManager.stopLoading();
                    ViewManager.handleError(err,{
                        name: "Buchungsfehler",
                        message: "Verkauf konnte nicht gebucht werden"
                    }, true);
                }).then(function(postedOrder) {
                   // post finished
                   self.postActive = false;
                                      
                   // print               
                   self.printOrder(postedOrder);
                   
                   // do next
                   if ( Config.getProfile().iface_place ) {
                        var place_id = self.order.get('place_id');
                        var place = place_id ? self.placeStore.getPlaceById(place_id) : null;        
                        if ( place ) {
                          // set new amount
                          var amount = 0.0;
                          if ( self.op == '-' ) { 
                              // split operation
                              amount = place.get('amount') || 0.0;
                              if ( amount ) {
                                  amount = amount - self.order.get('amount_total');
                                  if ( amount < 0.0 ) amount = 0.0;
                              }
                          }
                          self.updatePlace(place, amount);
                        }
                        
                        // finish all
                        var finishLoading = function() {
                            ViewManager.stopLoading();
                            Ext.Viewport.fireEvent("showPlace");
                        };
                        
                        // check reload
                        if ( reload ) {
                            self.reloadData(function() {
                                self.validateLines(true)['catch'](finishLoading).then(finishLoading);                                    
                            });                           
                        } else {
                            finishLoading();    
                        }
                        
                    } else {
                    
                        // create next
                        self.nextOrder(function() {
                            ViewManager.stopLoading();
                        });
                        
                    }
                        
                });
            };
            
            // check next order to create
            if ( self.op == '-' ) {
            
                // create next order
                var nextOrder = ModelUtil.createDocument(self.order);
                self.setOrderDefaults(nextOrder);
                
                self.lineStore.each(function(line) {
                    // add to temp if diff not null
                    var qty_diff = line.get('qty_diff');

                    // calc new quantity
                    var qty_prev = line.get('qty_prev') || 0.0;
                    var qty_after = qty_prev - qty_diff;
                    if ( qty_after > 0.0 ) {
                        var nextOrderLine = ModelUtil.createDocument(line);
                        nextOrderLine.qty = qty_after;
                        nextOrder.line_ids.push(nextOrderLine);
                    }                               
                    
                    // remove line if not used
                    if ( qty_diff <= 0.0 ) {
                        self.lineStore.remove(line);
                    } 
                });
                
                // check next order
                if ( nextOrder.line_ids.length > 0 ) {
                    var db = Config.getDB();
                    db.post(nextOrder)['catch'](function(err) {
                        // handle error 
                        // post finished
                        self.postActive = false;
                        
                        // stop loading after error
                        ViewManager.stopLoading();
                        ViewManager.handleError(err,{
                            name: "Buchungsfehler",
                            message: "Zwischenrechnung konnte nicht erstellt werden"
                        }, true); 
                    }).then(function() {
                        // post after split
                        reload = true;
                        postOrder();
                    });         
                    
                } else {
                    // no next order, normal post
                    postOrder();
                }
                
            } else {
                // default mode 
                // only post
                postOrder();
            }
            
            
            
        }      
    },
    
    printOrder: function(order) {
        var self = this;        
        if ( !self.printTemplate ) {
            var profile = Config.getProfile();
            self.printTemplate = Ext.create('Ext.XTemplate',
                profile.receipt_header || '',
                '<table width="100%">',
                    '<tr>',
                        '<td colspan="2"><hr/></td>',
                    '</tr>',
                    '<tr>',
                        '<td width="34%">Beleg:</td>',
                        '<td>{o.name}</td>',
                    '</tr>',                    
                    '<tr>',
                        '<td width="34%">Datum:</td>',
                        '<td>{date:date("d.m.Y H:i:s")}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="34%">Kasse:</td>',
                        '<td>{[Config.getProfile().name]}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="34%">Bediener:</td>',
                        '<td>{[Config.getUser().name]}</td>',
                    '</tr>',
                    '<tpl if="place">',
                    '<tr>',
                        '<td width="34%">Platz:</td>',
                        '<td>{place}</td>',
                    '</tr>',
                    '</tpl>',
                    '<tpl if="o.ref">',
                    '<tr>',
                        '<td width="34%">Referenz:</td>',
                        '<td>{o.ref}</td>',
                    '</tr>',
                    '</tpl>',
                '</table>',
                '<tpl if="o.partner">',
                '<table width="100%">',
                    '<tr>',
                        '<td><hr/></td>',
                    '</tr>',
                    '<tr>',
                        '<td>K U N D E</td>',
                    '</tr>',
                    '<tr>',
                        '<td><hr/></td>',
                    '</tr>',
                    '<tr>',
                        '<td>',
                            '{o.partner.name}',
                            '<tpl if="o.partner.street"><br/>{o.partner.street}</tpl>',
                            '<tpl if="o.partner.street2"><br/>{o.partner.street2}</tpl>',
                            '<tpl if="o.partner.zip && o.partner.city"><br/>{o.partner.zip} {o.partner.city}</tpl>',
                        '</td>',
                    '</tr>',
                '</table>',
                '</tpl>',
                '<br/>',
                '<table width="100%">',
                '<tr>',
                    '<td colspan="2">Bezeichnung</td>',
                    '<td align="right" width="32%">Betrag {[Config.getCurrency()]}</td>',
                '</tr>',
                '<tr>',                
                    '<td colspan="3"><hr/></td>',
                '</tr>',
                '<tpl for="lines">',
                    '<tpl if="!this.hasTag(values,\'#\')">',
                        '<tpl if="this.hasFlag(values,\'l\')">',
                            '<tr>',                
                                '<td colspan="3"><hr/></td>',
                            '</tr>',
                        '</tpl>',
                        '<tpl if="this.hasTag(values,\'c\')">',
                            '<tr>',
                                '<td colspan="3">{name}</td>',                        
                            '</tr>',
                            '<tr>',
                                '<td colspan="3">{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]} {[Config.getCurrency()]}</td>',
                            '</tr>',
                        '<tpl else>',                       
                            '<tpl if="(!this.hasTag(values) && !this.hasFlag(values,\'u\')) || this.hasFlag(values,\'d\')">',
                                '<tr>',
                                    '<td colspan="3">{name}</td>',
                                '</tr>',
                                '<tr>',
                                    '<td width="5%">&nbsp;</td>',
                                    '<td>',
                                        '{[this.formatAmount(values)]} {[this.getUnit(values.uom_id)]}',
                                         '<tpl if="values.qty != 1.0">',
                                            ' * ',
                                            '{[futil.formatFloat(values.price,Config.getDecimals())]}',
                                            ' ',
                                            '{[Config.getCurrency()]}',
                                            '<tpl if="netto">',
                                            ' ',
                                            'NETTO',
                                            '</tpl>',
                                        '</tpl>', 
                                        '<tpl if="discount"> -{[futil.formatFloat(values.discount,Config.getDecimals())]}%</tpl>',
                                    '</td>',    
                                    '<td align="right" valign="buttom" width="32%">{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]}</td>',                        
                                '</tr>',
                            '<tpl else>',
                                '<tr>',
                                    '<td colspan="2">{name}</td>',
                                    '<td align="right" valign="buttom" width="32%">{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]}</td>',
                                '</tr>',
                            '</tpl>',
                        '</tpl>',                          
                        '<tpl if="notice">',
                            '<tr>',
                                '<td width="5%">&nbsp;</td>',
                                '<td colspan="2"><hr/></td>',                    
                            '</tr>',
                            '<tr>',
                                '<td width="5%">&nbsp;</td>',
                                '<td colspan="2">{[this.formatText(values.notice)]}</td>',                    
                            '</tr>',                        
                        '</tpl>',
                        '<tpl if="this.hasFlag(values,\'b\') && (xindex &lt; xcount)">',
                            '<tr>',                
                                '<td colspan="3"><hr/></td>',
                            '</tr>',
                        '</tpl>',
                    '</tpl>',
                '</tpl>',
                '<tr>',                
                    '<td colspan="3"><hr/></td>',
                '</tr>',
                '<tr>',
                    '<td align="right" colspan="2"><b>S U M M E</b></td>',
                    '<td align="right" width="32%"><b>{[futil.formatFloat(values.o.amount_total,Config.getDecimals())]}</b></td>',        
                '</tr>',
                '<tpl for="o.payment_ids">',
                '<tr>',
                    '<td align="right" colspan="2">{[this.getJournal(values.journal_id)]}</td>',
                    '<td align="right" width="32%">{[futil.formatFloat(values.amount,Config.getDecimals())]}</td>',        
                '</tr>',
                '</tpl>',                
                '</table>',                                
                '<tpl if="o.tax_ids && o.tax_ids.length &gt; 0">',
                    '<br/>',
                    '<table width="100%">',                    
                    '<tr>',
                        '<td width="70%">Steuer</td>',
                        '<td align="right" width="30%">Netto {[Config.getCurrency()]}</td>',
                    '</tr>',
                    '<tr>',                
                        '<td colspan="2"><hr/></td>',
                    '</tr>',
                    '<tpl for="o.tax_ids">',
                    '<tr>',
                        '<td width="70%">{name} {[futil.formatFloat(values.amount_tax,Config.getDecimals())]} {[Config.getCurrency()]}</td>',
                        '<td align="right" width="30%">{[futil.formatFloat(values.amount_netto,Config.getDecimals())]}</td>',        
                    '</tr>',
                    '</tpl>',
                    '</table>',
                '</tpl>',                
                profile.receipt_footer || '',
                {
                    getUnit: function(uom_id) {
                        var uom = self.unitStore.getById(uom_id);
                        return uom ? uom.get('name') : '';
                    },
                    getJournal: function(journal_id) {
                        var journal = Config.getJournal(journal_id);
                        return journal ? journal.name : '';
                    },
                    formatText: function(text) {
                        return text ? text.replace(/\n/g,'<br/>') : '';
                    },
                    formatAmount: function(values)  {
                        var dec = values.a_dec;
                        if ( dec < 0 ) {
                            return futil.formatFloat(values.qty, 0);
                        } else if ( dec > 0 ) {
                            return futil.formatFloat(values.qty, dec);
                        } else {
                            return futil.formatFloat(values.qty, Config.getQtyDecimals()); 
                        }
                    },
                    hasTag: function(values, tag) {
                        if ( !tag ) {
                            return values.tag ? true : false;
                        } else if ( !values.tag ) {
                            return false;
                        } else {
                            return values.tag == tag;
                        }
                    },
                    hasFlag: function(values, flag) {
                        if ( !flag) {
                            return values.flags ? true : false;
                        } else if ( !values.flags ) {
                            return false;
                        } else {
                            return values.flags.indexOf(flag) > -1;
                        }
                    }
                }                
            );
        }

        // get order if not passed
        if (!order) {
            order = this.order.getData();
        }

        // get place        
        var place = self.placeStore.getPlaceById(order.place_id);
        if ( place ) {
            place = place.get('name');
        }
        
        // data
        var data = {
            o: order,
            lines : order.line_ids,
            date: futil.strToDate(order.date),
            place: place
        };
        
        // render it
        var html = self.printTemplate.apply(data);
        // print/show it
        if ( !Config.hasPrinter() ) { 
            self.previewPrint(html);
        } else {
            Config.printHtml(html);
        }
        
        // open cash drawer
        Config.openCashDrawer();
    },
    
    
    previewPrint: function(html) {
        var self = this;
        html = '<div class="PrintReport">' + html + '</div>';       
        if ( !self.reportPanel ) {
            self.reportPanel = Ext.create('Ext.Panel',{
                hideOnMaskTap: true,
                modal: true,
                centered: true,
                scrollable: true,
                cls: 'PrintReport',
                height: '400px',
                width: '300px',
                layout: 'vbox',
                html: html 
            });                
            Ext.Viewport.add(self.reportPanel);
        } else {
            self.reportPanel.setHtml(html);
            self.reportPanel.show();
        }
    },
    
    printPlaceOrder: function(order) {
        var self = this;   
        if ( !self.printPlaceTemplate ) {
            var profile = Config.getProfile();
            self.printPlaceTemplate = Ext.create('Ext.XTemplate',
                '<table width="100%">',
                    '<tr>',
                        '<td colspan="2"><hr/></td>',
                    '</tr>',                    
                    '<tr>',
                        '<td width="34%">Datum:</td>',
                        '<td>{date:date("d.m.Y H:i:s")}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="34%">Kasse:</td>',
                        '<td>{[Config.getProfile().name]}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="34%">Bediener:</td>',
                        '<td>{[Config.getUser().name]}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="34%">Platz:</td>',
                        '<td>{place}</td>',
                    '</tr>',
                    '<tr>',
                        '<td colspan="2"><hr/></td>',
                    '</tr>',
                '</table>',
                '<table width="100%">',
                '<tpl for="lines">',
                    '<tpl if="this.hasFlag(values,\'1\') && (xindex &gt; 1)">',
                        '<tr>',                
                            '<td colspan="2"><hr/></td>',
                        '</tr>',
                    '</tpl>',                    
                    '<tr>',                        
                        '<tpl if="this.hasTag(values,\'#\')">',
                            '<td colspan="2">{name}</td>',
                        '<tpl elseif="this.hasFlag(values,\'2\')">',
                            '<tpl if="values.qty == 1.0">',
                                '<td width="20%">&nbsp;</td>',
                                '<td>{name}</td>',
                            '<tpl else>',
                                '<td width="20%">&nbsp;</td>',
                                '<td>&nbsp;{name} x {[this.formatAmount(values)]} {[this.getUnit(values.uom_id)]}</td>',
                            '</tpl>',
                        '<tpl elseif="this.hasFlag(values,\'u\')">',
                            '<td width="20%">&nbsp;</td>',
                            '<td>{name}</td>',
                        '<tpl else>',
                            '<td width="20%" align="right">{[this.formatAmount(values)]}</td>',
                            '<td>&nbsp;{[this.getUnit(values.uom_id)]} {name}</td>',
                        '</tpl>',
                    '</tr>',                    
                    '<tpl if="notice">',
                        '<tr>',
                            '<td></td>',
                            '<td>{[this.formatText(values.notice)]}</td>',
                        '</tr>',
                    '</tpl>',
                    '<tpl if="this.hasFlag(values,\'1\')">',
                        '<tr>',                
                            '<td colspan="2"><hr/></td>',
                        '</tr>',
                    '</tpl>',
                '</tpl>',
                '</table>',
                {
                    getUnit: function(uom_id) {
                        var uom = self.unitStore.getById(uom_id);
                        return uom ? uom.get('name') : '';
                    },
                    formatText: function(text) {
                        return text ? text.replace(/\n/g,'<br/>') : '';
                    },
                    formatAmount: function(values)  {
                        var dec = values.a_dec;
                        if ( dec < 0 ) {
                            return futil.formatFloat(values.qty, 0);
                        } else if ( dec > 0 ) {
                            return futil.formatFloat(values.qty, dec);
                        } else {
                            return futil.formatFloat(values.qty, Config.getQtyDecimals()); 
                        }
                    },
                    hasTag: function(values, tag) {
                        if ( !tag ) {
                            return values.tag ? true : false;
                        } else if ( !values.tag ) {
                            return false;
                        } else {
                            return values.tag == tag;
                        }
                    },
                    hasFlag: function(values, flag) {
                        if ( !flag) {
                            return values.flags ? true : false;
                        } else if ( !values.flags ) {
                            return false;
                        } else {
                            return values.flags.indexOf(flag) > -1;
                        }
                    }             
                }                
            );
        }

        // get order if not passed
        if (!order) {
            order = this.order.getData();
        }
        
        // get place        
        var place = self.placeStore.getPlaceById(order.place_id);
        // data
        var data = {
            o: order,
            lines: order.line_ids,
            date: futil.strToDate(order.date),
            place: place && place.get('name') || ''
        };
        
        // check log ids
        if ( order.log_ids && order.log_ids.length > 0 ) {
            var lastLog = order.log_ids[order.log_ids.length-1];
            data.lines = lastLog.line_ids;
            data.date = futil.strToDate(lastLog.date);
        }
        
        // print/show
        var lines = data.lines;
        Ext.each(Config.getPrinters(), function(printer) {
            var filtered = [];
            Ext.each(lines, function(line) {
                if ( printer.isProductAllowed(line.product_id) ) {
                    filtered.push(line);
                }  
            });
            
            data.lines = filtered;
            if ( filtered.length > 0 ) { 
                var html = self.printPlaceTemplate.apply(data);
                
                if ( !printer.isAvailable() ) {
                    self.previewPrint(html); 
                }  else {
                    printer.printHtml(html)['catch'](function(err) {
                       ViewManager.handleError(err); 
                    });
                }
            }
        });
    },
    
    display: function() {
        if ( Config.displayFullCharset() ) {
            var total = this.order ? this.order.get('amount_total') : 0.0;
            Config.display(futil.formatFloat(total, Config.getDecimals()) + " " + Config.getCurrency());
        } else {
            var amount_total = this.order ? this.order.get('amount_total') : null;
            if ( amount_total ) {
                Config.display(amount_total.toFixed(2));
            } else {
                Config.display("0.00");
            }
        }
    },
    
    validatePayment: function() {
        var self = this;
        if ( !self.summaryTemplate ) {
            self.summaryTemplate = Ext.create('Ext.XTemplate',
                '<div class="PaymentItem">',
                '<div class="PaymentName">',
                    'Bezahlt',
                '</div>',
                '<div class="PaymentValue">',
                    '{[futil.formatFloat(values.payment)]}',
                '</div>',
                '</div>',
                '<div class="PaymentItem">',
                '<div class="PaymentName">',
                    'Restbetrag',
                '</div>',
                '<div class="PaymentValue">',
                    '{[futil.formatFloat(values.rest)]}',
                '</div>',
                '</div>',
                '<div class="PaymentChangeItem">',
                '<div class="PaymentName">',
                    'Wechselgeld',
                '</div>',
                '<div class="PaymentValue">',
                    '{[futil.formatFloat(values.change)]}',
                '</div>',
                '</div>',
                '</div>');
        }
        
        var payment_ids = [];
        
        // calc
        var change = 0.0;
        var total = self.order.get('amount_total');
        var rest = total;
        self.paymentStore.each(function(data) {
            var payment = data.get('payment');
            var journal = data.get('journal');
            var curRest = rest;
            
            //calc
            if ( payment >= rest && total >= 0 ) {
                change += (payment-rest);
                rest = 0;
            } else {
                rest -= payment;
            }
            
            // add payment
            payment_ids.push({
                journal_id : journal._id,
                amount : curRest - rest,
                payment : payment
            });
        });
        
        // update label
        var html = self.summaryTemplate.apply({
            change : change,
            rest : rest,
            payment : total - rest            
        });
        self.getPaymentSummary().setHtml(html);
        
        // set payment
        self.order.set('payment_ids', payment_ids);
        // check if it is valid
        return rest === 0;
    },
    
    onPayment: function() {
        ViewManager.hideMenus();            
        if ( !this.isDraft() ) return;
        
        var self = this;
        var inputView = self.getOrderInputView();
        if ( inputView.getActiveItem() != self.getPaymentPanel() ) {
            
            // init payment
            self.validateLines().then(function() {                

                var amount_total = self.order.get('amount_total');
                var profile = Config.getProfile();
                
                // first payment line is cash line
                var payment = [{
                    journal : Config.getCashJournal(),
                    amount : amount_total,
                    payment : amount_total
                }];
                // process other
                Ext.each(profile.journal_ids, function(journal) {
                    if ( journal.type !== 'cash' ) {
                        payment.push({
                           journal : journal,
                           amount : 0.0,
                           payment: 0.0
                        });
                    }
                });
                
                
                // view payment
                inputView.setActiveItem(self.getPaymentPanel());
                
                // set initial payment
                self.paymentStore.setData(payment); 
                self.validatePayment();
                self.getPaymentItemList().selectRange(0,0,false);
            });
            
        } else {
            inputView.setActiveItem(self.getOrderItemList());
        }
    },
    
    createCashState: function() {
        var self = this;

        // reset place
        self.place = null;
        
        var db = Config.getDB();
        var profile = Config.getProfile();
        var user_id = Config.getUser()._id;
        var fpos_user_id = profile.user_id;
        
        var turnover = profile.last_turnover;
        var cpos = profile.last_cpos;
        var date = futil.datetimeToStr(new Date());
        var order_id;
      
        if ( user_id && fpos_user_id) {
            ViewManager.startLoading("Kassenstand erstellen");
            
            var resetPlaces = [];            
            DBUtil.search(db, [['fdoo__ir_model','=','fpos.order'],['state','=','draft']], {include_docs: true}).then(function(res) {
               var bulkUpdate = [];
               Ext.each(res.rows, function(row) {
                     // check if place are to reset
                     if ( profile.iface_place ) {                       
                       var place = self.placeStore.getPlaceById(row.doc.place_id);
                       if ( place ) {
                            resetPlaces.push(place);
                       } 
                     } 
                     // mark deleted                        
                     row.doc._deleted = true;
                     bulkUpdate.push(row.doc);
               });
               return db.bulkDocs(bulkUpdate);
            }).then(function(res) {
                // reset places
                Ext.each(resetPlaces, function(place) {
                    self.updatePlace(place, 0.0);
                });
                
                return Config.queryLastOrder().then(function(res) {
                        if ( res.rows.length > 0 ) {
                            var lastOrder = res.rows[0].doc;
                            turnover = lastOrder.turnover;
                            cpos = lastOrder.cpos;
                        } 
                        return db.post({
                                'fdoo__ir_model' : 'fpos.order',
                                'fpos_user_id' : fpos_user_id,
                                'user_id' : user_id,
                                'state' : 'draft',
                                'date' : date,
                                'ref' : 'Kassensturz',
                                'tax_ids' : [],
                                'line_ids' : [
                                    {
                                        // TURNOVER
                                        'name' : 'Umsatzzähler',
                                        'price' : turnover,
                                        'qty' : 1.0,
                                        'subtotal_incl' : turnover,
                                        'discount' : 0.0,
                                        'sequence' : 0,
                                        'tag' : 'c'
                                    },
                                    {
                                        // BALANCE
                                        'name' : 'Kassenstand SOLL',
                                        'price' : cpos,
                                        'qty' : 1.0,
                                        'subtotal_incl' : cpos,
                                        'discount' : 0.0,
                                        'sequence' : 1,
                                        'tag' : 'b'
                                    }, 
                                    {
                                        // SHOULD
                                        'name' : 'Kassenstand IST',
                                        'price' : cpos,
                                        'qty' : 1.0,
                                        'subtotal_incl' : cpos,
                                        'discount' : 0.0,
                                        'sequence' : 2,
                                        'tag' : 'r'
                                    }
                                    
                                ],
                                'amount_tax' : 0.0,
                                'amount_total' : 0.0,
                                'tag' : 's' // CASH STATE
                        })['catch'](function(err) {          
                           ViewManager.stopLoading();
                           ViewManager.handleError(err,{
                                name: "Kassensturz Fehler",
                                message: "Kassensturz konnte nicht erstellt werden"
                           });
                        }).then(function(res) {
                            ViewManager.stopLoading();                            
                            self.reloadData();
                        });
                    });
            })['catch'](function(err) {          
               ViewManager.stopLoading();
               ViewManager.handleError(err,{
                    name: "Kassensturz Fehler",
                    message: "Kassensturz konnte nicht erstellt werden"
               });
            });
        }
        
    },
    
    createSummary: function() {
        return {
            names: [],
            map: {},
            total: 0.0           
        };
    },
    
    updateLineSummary: function(summary, line, ignore) {
        var subtotal_incl = line.subtotal_incl || 0.0;
        if ( !ignore ) {
        
            var name = line.name || '';
            var qty = line.qty || 0.0;
            var discount = line.discount || 0.0;
            var price = line.price || 0.0;
            
            var variants = summary.map[name];
            if ( !variants ) {
                variants = {};
                summary.map[name] = variants;
                summary.names.push(name);
            }
            
            var key = [price, discount];
            var entry = variants[key];
         
            if (!entry) {
                entry = {
                    tag: 's',
                    flags: 'd2',
                    name: name,
                    price: price,                                
                    qty : qty,
                    uom_id: line.uom_id,
                    subtotal_incl: subtotal_incl,
                    sequence : 0,
                    discount: discount
                };
                variants[key] = entry;
            } else {            
                entry.subtotal_incl += subtotal_incl;
                entry.qty += qty;
            }      
             
        }
        summary.total += subtotal_incl; 
    },
    
    updateLineIOSummary: function(summary, line, ignore) {
        var amount = line.subtotal_incl || 0.0;
        var name = line.name || '';
        if ( !ignore ) {
            var entry = summary.map[name];
            if (!entry) {
                entry = {
                    tag: 's',
                    flags: '2',
                    name: name,
                    price: amount,                                
                    qty : 1.0,
                    uom_id: line.uom_id,
                    subtotal_incl: amount,
                    sequence : 0,
                    discount: 0.0
                };
                summary.map[entry.name] = entry;
                summary.names.push(entry.name);
            } else {            
                entry.subtotal_incl += amount;
                entry.price = entry.subtotal_incl;
            }       
        }
        summary.total += amount; 
    },
    
    updatePaymentSummary: function(summary, payment, ignoreCashIO) {
        var journal = Config.getJournal(payment.journal_id);
        var entry = summary.map[journal.name];
        var amount = payment.amount || 0.0;
        
        // ignore cashio
        if ( ignoreCashIO && journal.type == 'cash' ) {
            amount -= ignoreCashIO;
        } 
        
        if (!entry) {
            entry = {
                tag: 's',
                flags: '2',
                name: journal.name,
                price: amount,                                
                qty : 1.0,
                subtotal_incl: amount,
                sequence : 0,
                discount: 0.0
            };
            
            summary.map[entry.name] = entry;
            summary.names.push(entry.name);
        } else {
            entry.subtotal_incl += amount;
            entry.price = entry.subtotal_incl;
        }
        summary.total += amount;
    },
    
    updateTaxSummary: function(summary, tax) {
        var name = tax.name || '';
        var entry = summary.map[name];
        var amount = tax.amount_tax || 0.0;
        if (!entry) {
            entry = {
                tag: 's',
                flags: '2',
                name: name,
                price: amount,                                
                qty : 1.0,
                subtotal_incl: amount,
                sequence : 0,
                discount: 0.0
            };
            summary.map[entry.name] = entry;
            summary.names.push(entry.name);
        } else {
            entry.subtotal_incl += amount;
            entry.price = entry.subtotal_incl;
        }
        summary.total += amount;   
    },
    
    createCashReport: function(user, detail, finish) {
        var self = this;

         // reset place
        self.place = null;
        
        // vars
        var db = Config.getDB();
        var profile = Config.getProfile();
        var user_id = Config.getUser()._id;
        var fpos_user_id = profile.user_id;
        var date = futil.datetimeToStr(new Date());
        var turnover = profile.last_turnover;
        var cpos = profile.last_cpos;
        
        // check user
        if ( !user_id || !fpos_user_id )
            return;
        
        // start        
        if ( finish ) {
            ViewManager.startLoading("Kassenabschluss erstellen");
        } else {
            ViewManager.startLoading("Bericht erstellen");
        }
        
        var createOverview = function() {
            Config.queryOrders().then(function(orders) {
                var sumLine = self.createSummary();
                var sumIncome = self.createSummary();
                var sumExpense = self.createSummary();
                var sumPayment = self.createSummary();
                var sumTax = self.createSummary();
                
                var lines = [];                    
                var seq = 1;
                
                Ext.each(orders, function(order) {
                    if ( !order.tag && (!user || order.user_id == user._id) ) {
                        var ignoreCashIO = 0.0;
                        
                        // positions                        
                        Ext.each(order.line_ids, function(line) {
                            // get product detail                            
                            var pos_report = false;
                            if (line.product_id) {
                                var product = self.productStore.getProductById(line.product_id);
                                if (product) {
                                    pos_report = product.get('pos_report');
                                }
                            }           
                            // sumup                     
                            var ignoreDetail = !detail && !pos_report;
                            if ( !line.tag ) {
                                self.updateLineSummary(sumLine, line, ignoreDetail);                             
                            } else if ( line.tag == 'i') {
                                self.updateLineIOSummary(sumIncome, line, ignoreDetail);
                                ignoreCashIO -= line.subtotal_incl;
                            } else if ( line.tag == 'o') {
                                self.updateLineIOSummary(sumExpense, line, ignoreDetail);
                                ignoreCashIO += line.subtotal_incl;
                            }
                        });
                        
                        //payment and taxes
                        if ( !user ) {
                            // calc taxes
                            Ext.each(order.tax_ids, function(tax) {
                                self.updateTaxSummary(sumTax, tax);
                            });
                            
                            // calc payment
                            Ext.each(order.payment_ids, function(payment) {
                                self.updatePaymentSummary(sumPayment, payment, ignoreCashIO);
                            });
                        }
                    }              
                });
                
                
                // HEADER         
                           
                var ref = 'Kassenbericht';
                var header = 'Verkäufe';
                var tag = '';
                if ( finish ) {
                    ref = 'Kassenabschluss';
                    tag = 's';
                } else if ( user ) {
                    ref = 'Meine Verkäufe';
                    header = 'Verkäufe ' + user.name;                        
                }
                
                
                // STATE
                
                // if detail show current state
                if ( !user ) {
                    lines.push(
                        {
                            // TURNOVER
                            name : 'Umsatzzähler',
                            price : turnover,
                            qty : 1.0,
                            subtotal_incl : turnover,
                            discount : 0.0,
                            sequence : seq++,
                            tag : 'c',
                            flags: 'b'
                        },
                        {
                            // BALANCE
                            name : 'Kassenstand',
                            price : cpos,
                            qty : 1.0,
                            subtotal_incl : cpos,
                            discount : 0.0,
                            sequence : seq++,
                            tag : 's'
                        });
                        
                }
                
                
                // PAYMENTS         
                
                lines.push({
                    name : "Umsatz",
                    price : sumPayment.total,
                    qty : 1.0,
                    subtotal_incl : sumPayment.total,
                    discount : 0.0,
                    sequence : seq++,
                    tag : 's',
                    flags: 'l'
                });
                
                if ( sumPayment.names.length > 0 ) {    
                    sumPayment.names.sort();
                    Ext.each(sumPayment.names, function(name) {                    
                        var entry = sumPayment.map[name];
                        entry.sequence = seq++;
                        lines.push(entry);
                    } );
                }


                // INCOME   
                             
                lines.push({
                    name : "Einzahlungen",
                    price : sumIncome.total,
                    qty : 1.0,
                    subtotal_incl : sumIncome.total,
                    discount : 0.0,
                    sequence : seq++,
                    tag : 's',
                    flags: 'l'
                });
                    
                if ( sumIncome.names.length > 0) {
                    sumIncome.names.sort();
                    Ext.each(sumIncome.names, function(name) {                    
                        var entry = sumIncome.map[name];
                        entry.sequence = seq++;
                        lines.push(entry);
                    } );
                }
                
                // EXPENSE
                               
                lines.push({
                    name : "Auszahlungen",
                    price : sumExpense.total,
                    qty : 1.0,
                    subtotal_incl : sumExpense.total,
                    discount : 0.0,
                    sequence : seq++,
                    tag : 's',
                    flags: 'l'
                });
                   
                if ( sumExpense.names.length > 0) { 
                    sumExpense.names.sort();
                    Ext.each(sumExpense.names, function(name) {                    
                        var entry = sumExpense.map[name];
                        entry.sequence = seq++;
                        lines.push(entry);
                    } );
                }
                 
                // TAXES
                
                lines.push({
                    name : "Steuern",
                    price : sumTax.total,
                    qty : 1.0,
                    subtotal_incl : sumTax.total,
                    discount : 0.0,
                    sequence : seq++,
                    tag : 's',
                    flags: 'l'
                });
                
                if ( sumTax.names.length > 0 ) {    
                    sumTax.names.sort();
                    Ext.each(sumTax.names, function(name) {                    
                        var entry = sumTax.map[name];
                        entry.sequence = seq++;
                        lines.push(entry);
                    } );
                }
                
                // LINES                   

                lines.push({
                    name : header,
                    price : sumLine.total,
                    qty : 1.0,
                    subtotal_incl : sumLine.total,
                    discount : 0.0,
                    sequence : seq++,
                    tag : 's',
                    flags: 'lb'
                });
                
                if ( sumLine.names.length > 0 ) {                    
                    sumLine.names.sort();
                    Ext.each(sumLine.names, function(name) {                    
                        var variants = sumLine.map[name];
                        for (var prop in variants ) {
                            if (variants.hasOwnProperty(prop) ) {
                                var entry = variants[prop];
                                entry.sequence = seq++;
                                lines.push(entry);
                            }
                        }
                    } );
                }
                
                // FINISH
                if ( finish && profile.fpos_income_id && profile.fpos_expense_id ) {
                    // get income/expense products
                    var product_income = self.productStore.getProductById(profile.fpos_income_id);
                    var product_expense = self.productStore.getProductById(profile.fpos_expense_id);
                    if ( product_income &&  product_expense ) {
                        // check for expense
                        if ( cpos > 0.0 ) {
                            lines.push({
                                name : product_expense.get('name'),
                                product_id : product_expense.getId(),
                                uom_id : product_expense.get('uom_id'),
                                tax_ids : product_expense.get('taxes_id'),
                                qty: 1.0,
                                price : -cpos,
                                subtotal_incl : -cpos,
                                tag: 'o',
                                flags: 'l',
                                sequence: seq++
                            });         
                        } 
                        // check for income
                        else if ( cpos < 0.0 ) {
                            lines.push({
                                name : product_income.get('name'),
                                product_id : product_income.getId(),
                                uom_id : product_income.get('uom_id'),
                                tax_ids : product_income.get('taxes_id'),
                                qty: 1.0,
                                price : -cpos,
                                subtotal_incl : -cpos,
                                tag: 'i',
                                flags: 'l',
                                sequence: seq++
                            });     
                        }
                    }
                }
                                    
                 
                //CREATE
                return db.post({                    
                    'fdoo__ir_model' : 'fpos.order',
                    'fpos_user_id' : fpos_user_id,
                    'user_id' : user_id,
                    'ref' : ref,
                    'state' : 'draft',
                    'date' : date,
                    'tax_ids' : [],
                    'line_ids' : lines,
                    'tag' : tag,
                    'amount_tax' : 0.0,
                    'amount_total' : 0.0
                })['catch'](function(err) {          
                  ViewManager.stopLoading();
                  ViewManager.handleError(err,{
                        name: "Kassenbericht Fehler",
                        message: "Kassenbericht konnte nicht erstellt werden"
                   });
                }).then(function(res) {
                    //FINISH                                                    
                    self.reloadData(function() {
                        self.validateLines()['catch'](function(err) {
                            ViewManager.stopLoading();
                            ViewManager.handleError(err,{
                                name: "Kassenbericht Fehler",
                                message: "Kassenbericht konnte nicht erstellt werden"
                           });
                        }).then(function(){
                            ViewManager.stopLoading();    
                        });                        
                    });
                });
            
            })['catch'](function(err) {
               ViewManager.stopLoading();
               ViewManager.handleError(err,{
                    name: "Kassenbericht Fehler",
                    message: "Kassenbericht konnte nicht erstellt werden"
               });
            });
       };
        
        // CREATE REPORT
        var createReport = function() {
             Config.queryLastOrder().then(function(res) {
                if ( res.rows.length > 0 ) {
                    var lastOrder = res.rows[0].doc;
                    turnover = lastOrder.turnover;
                    cpos = lastOrder.cpos;
                }
                createOverview();
            })['catch'](function(err) {          
               ViewManager.stopLoading();
               ViewManager.handleError(err,{
                    name: "Verkaufsübersicht Fehler",
                    message: "Verkaufsübersicht konnte nicht erstellt werden"
               });
            });            
        };
        

        // CHECK FINISH
        if ( finish )  {
            // DELETE DRAFT
            var resetPlaces = [];            
            DBUtil.search(db, [['fdoo__ir_model','=','fpos.order'],['state','=','draft']], {include_docs: true}).then(function(res) {
               var bulkUpdate = [];
               Ext.each(res.rows, function(row) {
                     // check if place are to reset
                     if ( profile.iface_place ) {                       
                       var place = self.placeStore.getPlaceById(row.doc.place_id);
                       if ( place ) {
                            resetPlaces.push(place);
                       } 
                     } 
                     // mark deleted                        
                     row.doc._deleted = true;
                     bulkUpdate.push(row.doc);
               });
               return db.bulkDocs(bulkUpdate);
            }).then(function(res) {
                // reset places
                Ext.each(resetPlaces, function(place) {
                    self.updatePlace(place, 0.0);
                });
                createReport();
            });
        } else {
            // NORMAL REPORT
            createReport();
        }
    },
    
    onCreateCashState: function() {
        ViewManager.hideMenus();
        this.createCashReport(null, false, true);
    },
    
    onCashReport: function() {
        ViewManager.hideMenus();
        this.createCashReport(null, false);
    },
   
    onCashUserReport: function() {
        ViewManager.hideMenus();
        this.createCashReport(Config.getUser(), true);
    },
    
    onPrintAgain: function() {
        var self = this;
        ViewManager.hideMenus();
        var db = Config.getDB();
        Config.queryLastOrder().then(function(res) {
            if ( res.rows.length > 0 ) {
                var order = res.rows[0].doc;
                if ( order.partner_id ) {
                    db.get(order.partner_id).then(function(partner) {
                        order.partner = partner;
                        self.printOrder(order);
                    })['catch'](function(err) {
                        self.printOrder(order);
                    });
                } else {
                    self.printOrder(order);
                }
            }
         });
    },
    
    onKeycode: function(keycode) {
        if ( keycode >= 48 && keycode <= 57 ) {            
            var c = String.fromCharCode(keycode);
            this.inputAction(c);
        } else {
            switch ( keycode ) {
                case 13:
                    this.onCash();
                    break;
                case 27:
                    this.onInputCancelTap();
                    break;
                case 190:
                    this.inputAction('.');
                    break;
                case 8:
                    this.onPayment();
                    break;                
            }
        } 
    },
    
    onBarcode: function(barcode) {
        var product = this.productStore.searchProductByEan(barcode);
        if ( product ) {
            this.productInput(product);
        }
    },
    
    onKeyDown: function(e) {
        var keycode = e.keyCode ? e.keyCode : e.which;
        if ( keycode === 0 ) {
            if ( e.code == 'MailSend') {
                this.onEditOrder();
            }
        } else if ( keycode == 8 ) {
            // only react if nothing is selected
            if ( e.currentTarget && e.currentTarget.activeElement && e.currentTarget.activeElement.localName == 'body' ) {
                this.barcodeScanner.detectBarcode(e);
            }
        } else {
            this.barcodeScanner.detectBarcode(e);
        }       
    }
    
});
    
