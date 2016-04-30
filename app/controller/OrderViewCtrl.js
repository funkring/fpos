/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.OrderViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.Config',
        'Ext.proxy.PouchDBUtil',
        'Fpos.view.OrderView',
        'Fpos.view.OrderLineFormView',
        'Fpos.view.OrderFormView',
        'Fpos.view.ScaleView'
    ],
    config: {
        refs: {
            orderView: '#orderView',
            posDisplay: '#posDisplayLabel',
            orderItemList: '#orderItemList',
            paymentItemList: '#paymentItemList',
            paymentPanel: '#paymentPanel',
            stateDisplay: '#posDisplayState',
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
                initialize: 'posDisplayInitialize'
            },
            stateDisplay: {
                initialize: 'stateDisplayInitialize'  
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
                tap: 'onInputCancelTap'
            },
            'button[action=inputModeSwitch]' : {
                tap: 'onInputModeSwitch'
            },
            'button[action=inputNumber]' : {
                tap: 'onInputNumber'
            },
            'button[action=editOrder]' : {
                tap: 'onEditOrder'
            },
            'button[action=inputCash]' : {
                tap: 'onCash'
            },
            'button[action=inputPayment]' : {
                tap: 'onPayment'
            },
            'button[action=createCashState]' : {
                tap: 'onCreateCashState'
            },
            'button[action=printAgain]' : {
                tap: 'onPrintAgain'
            }
            
        }
    },
    
    init: function() {
        var self = this;
        
        this.order = null;
        this.printTemplate = null;
        this.paymentEnabled = false;
        
        this.mode = '*';
        this.inputSign = 1; 
        this.inputText = '';
        
        this.lineStore = Ext.StoreMgr.lookup("PosLineStore");
        this.orderStore = Ext.StoreMgr.lookup("PosOrderStore");
        this.taxStore = Ext.StoreMgr.lookup("AccountTaxStore");
        this.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");
        this.paymentStore = Ext.StoreMgr.lookup("PosPaymentStore");
        
        this.displayTask = Ext.create('Ext.util.DelayedTask', function() {
            self.display();
        });
    },    
    
    posDisplayInitialize: function(display) {
        display.setTpl(Ext.create('Ext.XTemplate',
           '{[futil.formatFloat(values.amount_total,Config.getDecimals())]}'
        ));
    },
    
    stateDisplayInitialize: function(display) {
        display.setTpl(Ext.create('Ext.XTemplate',
           '<div class="PosOrderState">',
               '<div class="PosOrderCurrency">',
               '{[Config.getCurrency()]}',
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
            '</div>'
        ));
    },
     
    orderItemListInitialize: function(orderItemList) {
        var self = this;
        orderItemList.setItemTpl(Ext.create('Ext.XTemplate',
                '<tpl if="tag || (flags && flags.indexOf(\'u\') &gt; -1) ">',
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
                        '{[futil.formatFloat(values.qty,Config.getQtyDecimals())]}',
                        ' ',
                        '{[this.getUnit(values.uom_id)]}',
                        ' * ',
                        '{[futil.formatFloat(values.brutto_price,Config.getDecimals())]} {[Config.getCurrency()]}',
                        ' ',
                        '<tpl if="discount &gt; 0.0">',
                            '<span class="PosOrderLineDiscount">',
                            '- {[futil.formatFloat(values.discount,Config.getDecimals())]} %',
                            '</span>',
                        '</tpl>',
                    '</div>',                    
                '</div>',
                '<div class="PosOrderLinePrice">',
                    '{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]}',
                '</div>', 
                '</tpl>',
                {                
                    getUnit: function(uom_id) {
                        var uom = self.unitStore.getById(uom_id);
                        return uom && uom.get('name') || '';
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
        
        // validation event         
        Ext.Viewport.on({
            scope: self,
            validateLines: self.validateLines            
        });
        
        Ext.Viewport.on({
            scope: self,
            posKey: self.onKeyDown
        });
        
        // reload data
        self.reloadData();
    },
    
    productInput: function(product) {
        var self = this;
        if ( self.isEditable() ) {
            
            var changedLine = null;
            var profile = Config.getProfile();
            
            var toWeight = product.get('to_weight');
            var noGroup = toWeight || profile.iface_nogroup || product.get('pos_nogroup') || false;
            
            if ( !noGroup ) {
                self.lineStore.each(function(line) {
                    if ( line.get('product_id') === product.getId() ) {
                        // update quantity
                        line.set('qty',(line.get('qty') || 0.0) + 1);
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
                    'name' : product.get('name'),
                    'product_id' : product.getId(),
                    'uom_id' : product.get('uom_id'),
                    'tax_ids' : product.get('taxes_id'),
                    'brutto_price' : product.get('brutto_price'),
                    'qty' : toWeight ? 0.0 : 1.0,
                    'subtotal_incl' : 0.0,
                    'discount' : 0.0,
                    'sequence' : self.lineStore.getCount()
                };
                
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
                } else if ( product.get('income_pdt') ) {
                    values.tag = "i";
                }  else if ( values.tag ) {
                    values.tag = null;
                }
                
                // add line
                changedLine = self.lineStore.add(values)[0];
                if ( changedLine ) {
                    changedLine.dirty = true;
                }
            }
            
            // validate lines
            self.validateLines().then(function() {
                self.getOrderItemList().select(changedLine);
                self.setDefaultItemMode(changedLine);
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
    
    // compute line values
    validateLine: function(line, taxes, taxlist) {
       var self = this;
       
       var price = line.get('brutto_price') || 0.0;

       var discount = line.get('discount') || 0.0;
       discount = 1.0 - (discount/100.0);
       
       var qty = line.get('qty') || 0.0;
       var total = qty * price * discount;
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
               
        // subtotal without tax
        var total_netto = (total-tax_fixed) / (1.0 + tax_percent);

        // sum tax
        Ext.each(tax_ids, function(tax_id) {
            var tax = taxes[tax_id];
            var amount_tax = 0.0;       
            if (tax.type === 'percent') {
                amount_tax = (total_netto * (1.0 + tax.amount)) - total_netto;
            } else if (tax.type === 'fixed') {
                amount_tax = (tax.amount * qty);
            }   
            tax.sum.amount_tax += amount_tax;
            tax.sum.amount_netto += total_netto;
            total_tax += amount_tax;
        });
        
        // set subtotal if dirty
        if ( line.get('subtotal_incl') != total ) {
            line.set('subtotal_incl', total);
        }
        
        // return subtotal brutto and amount tax
        return { subtotal_incl: total, 
                 amount_tax:  total_tax };
    },
    
    // validate lines of current order
    validateLines: function() {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        // primary check
        if ( self.order && self.order.get('state') === 'draft') {
                       
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
                lines.push(line.getData());
            });
            
            // set values
            self.order.set('tax_ids', tax_ids);
            self.order.set('amount_tax', amount_tax);
            self.order.set('amount_total', amount_total);
            self.order.set('turnover', turnover);
            if ( updateLines ) {
                self.order.set('line_ids', lines);
            } else {
                // check if line count has changed
                var curLines = self.order.get('line_ids');
                if ( !curLines || curLines.length != lines.length ) {
                    self.order.set('line_ids', lines);
                }                               
            }
            
            // notify display update
            self.displayTask.delay(800);

            // save            
            if ( self.order.dirty ) {
                self.order.save({
                    callback: function() {
                        deferred.resolve();
                    }
                });
            } else {
                deferred.resolve();
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
        self.getPosDisplay().setRecord(order);
        self.getStateDisplay().setRecord(order);
        self.getOrderItemList().deselectAll(true);
        
        var lines = order.get('line_ids');
        if ( lines ) {
            self.lineStore.setData(lines);
        } else {
            self.lineStore.setData([]);
        }        
    },
    
    // create new order
    nextOrder: function() {
        var self = this;
        var db = Config.getDB();
        
        var user_id = Config.getUser()._id;
        var fpos_user_id = Config.getProfile().user_id;
                
        if ( user_id && fpos_user_id) {
            var date = futil.datetimeToStr(new Date());  
            db.post({
                'fdoo__ir_model' : 'fpos.order',
                'fpos_user_id' : fpos_user_id,
                'user_id' : user_id,
                'state' : 'draft',
                'date' : date,
                'tax_ids' : [],
                'line_ids' : [],
                'amount_tax' : 0.0,
                'amount_total' : 0.0
            }).then(function(res) {                
                self.reloadData();
            });
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
            self.paymentEnabled = true;
        } else {
            if ( paymentButton ) { 
                paymentButton.setUi('posInputButtonOrange');
            }
            self.paymentEnabled = false;
        }
        self.setMode('*');
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
    
    fullDataReload: function() {
        var self = this;
        self.printTemplate = null;
        self.reloadData();
    },
        
    reloadData: function() {
        var self = this;

        var db = Config.getDB();
        var user = Config.getUser();
        
        self.setMode('*');
        self.resetView();  
                
        if ( user ) {
            var options = {
                params : {
                    domain : [['user_id','=',user._id],['state','=','draft']]
                },
                callback: function() {
                    if ( self.orderStore.getCount() === 0 ) {
                        // create new order
                        self.nextOrder();
                    } else {
                        // set current order
                        self.setOrder(self.orderStore.last());
                    }
                }
            };
            self.orderStore.load(options);
        } else {
            // load nothing
            self.orderStore.setData([]);
            self.setOrder(null);
        }        
    },
    
    isEditable: function() {
        return this.order && this.order.get('state') == 'draft' && !this.paymentEnabled;
    },
    
    onInputCancelTap: function() {
        var self = this;
        self.inputText = '';    
        
        // default editing
        if ( self.isEditable() ) {
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
                                if ( record.get('brutto_price') === doc.brutto_price) {
                                   self.lineStore.remove(record);
                                } else {
                                   record.set('brutto_price',doc.brutto_price);
                                }
                                self.validateLines();   
                            })['catch'](function(err) {
                                ViewManager.handleError(err, {name:'Fehler', error: 'Produkt kann nicht zurückgesetzt werden'});
                            });              
                        } else {
                            record.set('brutto_price',0.0);
                            self.validateLines();       
                        }
                    } else {
                        // reset quantity
                        if ( self.mode == "*") {
                            if ( record.get('qty') === 0.0 ) {
                                if ( !tag || tag != 'r' ) {
                                    self.lineStore.remove(record);
                                } else {
                                    record.set('qty',1.0);
                                }
                            } else {
                                if ( tag == 'o' || tag == 'i' || tag == 'r' ) {
                                    record.set('qty',1.0);
                                } else {
                                    record.set('qty',0.0);
                                }
                            }
                        // reset discount
                        } else if ( self.mode == "%") {
                            record.set('discount',0.0);
                        }                         
                        self.validateLines();
                    }
                }                
            } 
        } else if ( self.paymentEnabled ) {
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
            return futil.formatFloat(line.get('brutto_price'), Config.getDecimals());
        } else {
            return futil.formatFloat(line.get('qty'), Config.getQtyDecimals());
        }
    },
        
    inputAction: function(action) {
        var valid = true;   
        var commaPos, decimals, value;
        if ( this.isEditable() ) {
            
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
                                    line.set('qty',line.get('qty')*-1);
                                } else {
                                    line.set('brutto_price',line.get('brutto_price')*-1);
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
                            line.set('brutto_price', value*this.inputSign);
                        } else if ( this.mode == "%" ) {
                            line.set('discount', value);
                        } else {
                            line.set('qty', value*this.inputSign);
                        }
                        this.validateLines();
                    }
                }
            }
            
        }  else if ( this.paymentEnabled ) {
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
        this.setMode(button.getText());
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
                var brutto_price = line.get('brutto_price');              
                if ( brutto_price < 0 ) {
                    sign = -1;
                } else if ( brutto_price > 0) {
                    sign = 1;
                }
                this.setMode('€', sign);                
            } else {
                var qty = line.get('qty');
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
        var self = this;
        if ( self.order && !futil.isDoubleTap() ) {
            var lines = self.getOrderItemList().getSelection();
            var form;
            if ( lines.length > 0 ) {
                form = Ext.create("Fpos.view.OrderLineFormView", {'title' : 'Position'});
                form.setRecord(lines[0]);
            } else {
                form =  Ext.create("Fpos.view.OrderFormView", {'title' : 'Verkauf'});
                form.setRecord(this.order);
            }
            
            if ( form ) {
                if ( self.order.get('state') != 'draft') 
                    form.setDisabled(true);                
                Ext.Viewport.fireEvent("showForm", form); 
            }
        }
    },
    
    postOrder: function() {
        var self = this;
        
        if ( !self.order ) {
            throw  {
                name: "Buchungsfehler",
                message: "Kein Verkauf ausgewählt"
            };
        }
        
        var deferred = Ext.create('Ext.ux.Deferred');
        var db = Config.getDB();
        var profile = Config.getProfile();
        var hasSeq = false;
        
        self.validateLines()['catch'](function(err) {
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
                if ( !payment_ids || payment_ids.length === 0 ) {
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
                self.order.set('payment_ids',fixed_payments);
                self.order.set('date', date);
                self.order.set('seq', seq);
                self.order.set('name', Config.formatSeq(seq));
                self.order.set('state','paid');
                
                // turnover
                self.order.set('turnover',self.order.get('turnover')+turnover);
                // cpos
                self.order.set('cpos', cpos);
                
                // save
                self.order.save({
                    callback: function() {
                        deferred.resolve();           
                    }
                });
            };
            
            // query last order
            try {
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
            } catch (err) {
                deferred.reject(err);
            }
        });    
        return deferred.promise();      
    },
    
    onCash: function() {
        var self = this;
        if ( self.isEditable() || (self.paymentEnabled && self.validatePayment()) ) {
            //self.printOrder();
            // add payment
            // and print
            self.postOrder()['catch'](function(err) {
                ViewManager.handleError(err,{
                    name: "Buchungsfehler",
                    message: "Verkauf konnte nicht gebucht werden"
                }, true);
            }).then(function() {
                self.printOrder();
                self.reloadData();
            });
        } else {
            // if not editable
            // reload data
            self.reloadData();
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
                        '<td width="{attribWidth}">Beleg:</td>',
                        '<td>{o.name}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="{attribWidth}">Datum:</td>',
                        '<td>{date:date("d.m.Y H:i:s")}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="{attribWidth}">Kasse:</td>',
                        '<td>{[Config.getProfile().name]}</td>',
                    '</tr>',
                    '<tr>',
                        '<td width="{attribWidth}">Bediener:</td>',
                        '<td>{[Config.getUser().name]}</td>',
                    '</tr>',
                    '<tpl if="o.ref">',
                    '<tr>',
                        '<td width="{attribWidth}">Referenz:</td>',
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
                    '<td>Bezeichnung</td>',
                    '<td align="right" width="{priceColWidth}">Betrag {[Config.getCurrency()]}</td>',
                '</tr>',
                '<tr>',                
                    '<td colspan="2"><hr/></td>',
                '</tr>',
                '<tpl for="lines">',
                    '<tpl if="tag==\'c\'">',
                        '<tr>',
                            '<td colspan="2">{name}</td>',                        
                        '</tr>',
                        '<tr>',
                            '<td colspan="2">{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]} {[Config.getCurrency()]}</td>',
                        '</tr>',
                        '<tr>',                
                            '<td colspan="2"><hr/></td>',
                        '</tr>',
                    '<tpl else>',
                        '<tr>',
                            '<td>{name}</td>',
                            '<td align="right" width="{priceColWidth}">{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]}</td>',
                        '</tr>',
                        '<tpl if="!tag && !(flags && flags.indexOf(\'u\') &gt; -1)">',
                            '<tr>',
                                '<td colspan="2">',
                                    '<table width="100%">',
                                    '<tr>',
                                    '<td width="5%">&nbsp;</td>',
                                    '<td>',
                                        '{[futil.formatFloat(values.qty,Config.getQtyDecimals())]} {[this.getUnit(values.uom_id)]}',
                                        '<tpl if="values.qty != 1.0"> * {[futil.formatFloat(values.brutto_price,Config.getDecimals())]} {[Config.getCurrency()]}</tpl>', 
                                        '<tpl if="discount"> -{[futil.formatFloat(values.discount,Config.getDecimals())]}%</tpl>',
                                    '</td>',
                                    '</tr>',
                                    '</table>',
                                '</td>',        
                            '</tr>',
                        '</tpl>',
                    '</tpl>',
                    '<tpl if="notice">',
                    '<tr>',
                        '<td colspan="2">',
                            '<table width="100%">',
                                '<tr>',
                                    '<td width="5%">&nbsp;</td>',
                                    '<td>{[this.formatText(values.notice)]}</td>',
                                '</tr>',
                            '</table>',
                        '</td>',
                    '</tr>',
                    '</tpl>',
                '</tpl>',
                '<tr>',                
                    '<td colspan="2"><hr/></td>',
                '</tr>',
                '<tr>',
                    '<td align="right"><b>S U M M E</b></td>',
                    '<td align="right" width="{priceColWidth}"><b>{[futil.formatFloat(values.o.amount_total,Config.getDecimals())]}</b></td>',        
                '</tr>',
                '<tpl for="o.payment_ids">',
                '<tr>',
                    '<td align="right">{[this.getJournal(values.journal_id)]}</td>',
                    '<td align="right" width="{priceColWidth}">{[futil.formatFloat(values.amount,Config.getDecimals())]}</td>',        
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
                    }
                }                
            );
        }

        // get order if not passed
        if (!order) {
            order = this.order.getData();
        }
        
        // data
        var data = {
            o: order,
            lines : order.line_ids,
            priceColWidth: "32%",
            attribWidth: "34%",
            date: futil.strToDate(this.order.get('date'))
        };
        
        // render it
        var html = self.printTemplate.apply(data);
        // print/show it
        if ( !Config.hasPrinter() ) { 
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
        } else {
            Config.printHtml(html);
        }
       
        // open cash drawer
        Config.openCashDrawer();
    },
    
    display: function() {
        var amount_total = this.order ? this.order.get('amount_total') : null;
        if ( amount_total ) {
            Config.display(amount_total.toFixed(2));
        } else {
            Config.display("0.00");
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
                    'Wechelgeld',
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
        var self = this;
        var inputView = self.getOrderInputView();
        if ( inputView.getActiveItem() != self.getPaymentPanel() ) {
            
            // init payment
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
            
            // set initial payment
            self.paymentStore.setData(payment); 
            self.validatePayment();
            self.getPaymentItemList().selectRange(0,0,false);
            
            // view payment
            inputView.setActiveItem(self.getPaymentPanel());
            
        } else {
            inputView.setActiveItem(self.getOrderItemList());
        }
    },
    
    createCashState: function() {
        var self = this;
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

            DBUtil.search(db, [['fdoo__ir_model','=','fpos.order'],['state','=','draft']], {include_docs: true}).then(function(res) {
               var bulkUpdate = [];
               Ext.each(res.rows, function(row) {
                     row.doc._deleted = true;
                     bulkUpdate.push(row.doc);
               });
               return db.bulkDocs(bulkUpdate);
            }).then(function(res) {
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
                                'tax_ids' : [],
                                'line_ids' : [
                                    {
                                        // TURNOVER
                                        'name' : 'Umsatzzähler',
                                        'brutto_price' : turnover,
                                        'qty' : 1.0,
                                        'subtotal_incl' : turnover,
                                        'discount' : 0.0,
                                        'sequence' : 0,
                                        'tag' : 'c'
                                    },
                                    {
                                        // BALANCE
                                        'name' : 'Kassenstand SOLL',
                                        'brutto_price' : cpos,
                                        'qty' : 1.0,
                                        'subtotal_incl' : cpos,
                                        'discount' : 0.0,
                                        'sequence' : 1,
                                        'tag' : 'b'
                                    }, 
                                    {
                                        // SHOULD
                                        'name' : 'Kassenstand IST',
                                        'brutto_price' : cpos,
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
    
    onCreateCashState: function() {
        if ( !futil.isDoubleTap() ) {
            ViewManager.hideMenus();
            this.createCashState();
        }
    },
    
    onPrintAgain: function() {
        var self = this;
        if ( !futil.isDoubleTap() ) {
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
        }
    },
    
    onKeyDown: function(e) {
        var keycode = e.keyCode ? e.keyCode : e.which;
        if ( keycode >= 48 && keycode <= 57 ) {            
            var c = String.fromCharCode(keycode);
            this.inputAction(c);
        } else if ( keycode == 13 ) {
            this.onCash();
        } else if ( keycode == 27 ) {
            this.onInputCancelTap();
        } else if ( keycode === 0 ) {
            this.onEditOrder();
        } else if ( keycode == 190 ) {
            this.inputAction('.');
        } else if ( keycode ==8 ) {
            this.onPayment();
        }
    }
    
});
    