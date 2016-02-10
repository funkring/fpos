/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.OrderViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.Config',
        'Ext.proxy.PouchDBUtil',
        'Fpos.view.OrderView',
        'Fpos.view.OrderLineFormView',
        'Fpos.view.OrderFormView'
    ],
    config: {
        refs: {
            orderView: '#orderView',
            posDisplay: '#posDisplayLabel',
            orderItemList: '#orderItemList',
            stateDisplay: '#posDisplayState',
            inputButtonAmount: '#inputButtonAmount',
            inputButtonDiscount: '#inputButtonDiscount',
            inputButtonPrice: '#inputButtonPrice'
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
            }
            
        }
    },
    
    init: function() {
        var self = this;
        
        this.order = null;
        this.printTemplate = null;
        
        this.mode = '*';
        this.resetInputText();
        
        this.lineStore = Ext.StoreMgr.lookup("PosLineStore");
        this.orderStore = Ext.StoreMgr.lookup("PosOrderStore");
        this.taxStore = Ext.StoreMgr.lookup("AccountTaxStore");
        this.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");
        
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
                '</div>', {
                
                getUnit: function(uom_id) {
                    var uom = self.unitStore.getById(uom_id);
                    return uom && uom.get('name') || '';
                }
                
            }
        ));
        orderItemList.setStore(this.lineStore);
    },    

     
    orderViewInitialize: function() {
        var self = this;
        
        // reload event
        Ext.Viewport.on({
            scope: self,
            reloadData: self.reloadData
        });

        // product input event         
        Ext.Viewport.on({
            scope: self,
            productInput: self.productInput
        });
        
        // reload data
        self.reloadData();
    },
    
    productInput: function(product) {
        var self = this;
        if ( self.isEditable() ) {
        
            var changedLine = null;
            var toWeight = product.get('to_weight');
            if ( !toWeight ) {
                self.lineStore.each(function(line) {
                    if ( line.get('product_id') === product.getId() ) {
                        line.set('qty',(line.get('qty') || 0.0) + 1);
                        changedLine = line;
                        return false; //stop iteration
                    }
                });
            }
            
            if ( !changedLine ) {
                var db = Config.getDB();
                changedLine = self.lineStore.add({
                    'order_id' : self.order.getId(),
                    'name' : product.get('name'),
                    'product_id' : product.getId(),
                    'uom_id' : product.get('uom_id'),
                    'tax_ids' : product.get('taxes_id'),
                    'brutto_price' : product.get('brutto_price'),
                    'qty' : 1.0,
                    'subtotal_incl' : 0.0,
                    'discount' : 0.0,
                    'sequence' : self.lineStore.getCount()
                });
               
            }
            
            // validate lines
            self.validateLines().then(function() {
                self.getOrderItemList().select(changedLine);
                self.setMode('*');
            });
            
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
                        amount_tax : 0.0
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
            self.lineStore.each(function(line) {
                var total_line = self.validateLine(line, tax_group, tax_ids);                
                amount_total += total_line.subtotal_incl;
                amount_tax += total_line.amount_tax;
            });
            
            // set values
            self.order.set('tax_ids', tax_ids);
            self.order.set('amount_tax', amount_tax);
            self.order.set('amount_total', amount_total);
            self.displayTask.delay(800);
            // sync
            var syncRes = self.lineStore.sync({
                callback: function() {
                    if ( self.order.dirty ) {
                        self.order.save({
                            callback: function() {
                                deferred.resolve();
                            }
                        });
                    } else {
                        deferred.resolve();
                    }
                }
            });
            
            // if no sync was done resolve, deferred
            if ( (syncRes.added.length + syncRes.updated.length + syncRes.removed.length) === 0 ) {
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
        self.getPosDisplay().setRecord(order);
        self.getStateDisplay().setRecord(order);
        
        if ( order ) {
            var options = {
                params: {
                    domain : [['order_id','=',order.getId()]]
                },
                callback: function() {
                    self.validateLines();
                }                
            };
            self.lineStore.load(options);             
        } else {
            self.lineStore.load(function(store) {
               //load nothing                 
            });
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
                'amount_tax' : 0.0,
                'amount_total' : 0.0
            }).then(function(res) {
                self.reloadData();
            });
        }
    },
    
    setMode: function(mode) {
        var self = this;
        self.mode = mode;
        this.resetInputText();
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
    
    resetInputText: function() {
        this.inputSign = 1; 
        this.inputText = '';
    },
    
    reloadData: function() {
        var self = this;

        var db = Config.getDB();
        var user = Config.getUser();
        
        self.printTemplate = null;
        self.setMode('*');
                
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
            self.orderStore.load(function(store) {
                self.setOrder(null);    
            });       
        }        
    },
    
    isEditable: function() {
        return this.order && this.order.get('state') == 'draft';
    },
    
    // validates and stop loading
    finalValidate: function() {
        this.validateLines()['catch'](  function(err) {
            ViewManager.stopLoading();
            throw err;
        }).then(function() {
            ViewManager.stopLoading();                    
        });
    },
    
    onInputCancelTap: function() {
        var self = this;
        this.resetInputText();
        if ( self.isEditable() ) {
            
            ViewManager.startLoading("Zurücksetzen");

            var records = self.getOrderItemList().getSelection();
            if ( records.length > 0  ) {
                var record = records[0];
                
                // reset price price
                if ( this.mode == "€" ) {
                    var db = Config.getDB();
                    var product_id = record.get('product_id');
                    if ( product_id ) {
                        db.get(product_id).then(function(doc) {
                            record.set('brutto_price',doc.brutto_price);
                            self.finalValidate();                            
                        })['catch'](function(err) {
                            ViewManager.stopLoading();
                            throw err;
                        });              
                    } else {
                        record.set('brutto_price',0.0);
                        self.finalValidate();
                    }
                } else {
                    // reset quantity
                    if ( this.mode == "*") {
                        if ( record.get('qty') === 0.0 ) {
                            self.lineStore.remove(record);
                        } else {
                           record.set('qty',0.0);
                        }
                    // reset discount
                    } else if ( this.mode == "%") {
                        record.set('discount',0.0);
                    } 
                    
                    self.finalValidate();
                }
                
            } else {
                ViewManager.stopLoading();
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
        if ( this.isEditable() ) {
            
            var lines = this.getOrderItemList().getSelection();
            if ( lines.length > 0  ) {
            
                var line = lines[0];
                var valid = true;
                
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
                    if ( this.inputText.indexOf(".") < 0 ) {
                        this.inputText += "."; 
                    } else {
                        valid = false;
                    }
                // default number handling
                } else {
                    var commaPos = this.inputText.indexOf(".");
                    if ( commaPos >= 0 ) { 
                        var decimals = this.inputText.length - commaPos; 
                        if ( this.mode == '*' ) {
                            // only add if less than max qty decimals
                            if ( decimals > Config.getQtyDecimals()  ) {
                                valid = false;
                            }
                        // only add if less than max decimals
                        } else if ( decimals > Config.getDecimals() ) {
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
                    var value = parseFloat(this.inputText);
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
    },
    
    onInputModeSwitch: function(button) {
        this.setMode(button.getText());
    },
    
    onInputNumber: function(button) {
        this.inputAction(button.getText());
    },
    
    onItemSelectionChange: function() {
        this.setMode('*');
    },
    
    onEditOrder: function() {
        var self = this;
        if ( self.order && !futil.isDoubleTap() ) {
            var lines = self.getOrderItemList().getSelection();
            var form;
            if ( lines.length > 0) {
                form =  Ext.create("Fpos.view.OrderLineFormView", {'title' : 'Position'});
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
        var orderSeq = 0;
        var hasSeq = false;
        var seqId = '_local/orderseq';
        
        self.validateLines()['catch'](function(err) {
            deferred.reject(err);
        }).then(function(){
            return db.get(seqId).then(function(doc) {
                hasSeq = true;
                if ( doc.order_id == self.order.getId() ) {
                    orderSeq = doc.seq;
                } else {
                    doc.seq = orderSeq = doc.seq+1;
                    doc.order_id = self.order.getId();
                    return db.put(doc);
                }                
            })['catch'](function(err) {            
                if (hasSeq) {
                    // something goes wrong
                    // show error and cancel 
                    deferred.reject({
                        name: "Buchungsfehler",
                        message: "Sequenz konnte nicht akualisiert werden"
                    });
                } else {
                    //create first sequence
                    orderSeq = profile.last_seq+1;
                    return db.post({
                        _id: seqId,
                        seq: orderSeq,
                        order_id: self.order.getId() 
                    });                
                }
            }).then(function() {
                var payment_ids = self.order.get('payment_ids');
                
                // add cash payment if no payment                
                if ( !payment_ids || payment_ids.length === 0 ) {
                    var amount_total = self.order.get('amount_total');
                    self.order.set('payment_ids',[
                        {
                            journal_id : Config.getCashJournal()._id,
                            amount : amount_total,
                            payment : amount_total                     
                        }
                    ]);

                }
                var date = futil.datetimeToStr(new Date());
                self.order.set('date', date);
                self.order.set('seq', orderSeq);
                self.order.set('name', Config.formatSeq(orderSeq));
                self.order.set('state','paid');
                self.order.save({
                    callback: function() {
                        deferred.resolve();           
                    }
                });
            });
        });    
        return deferred.promise();      
    },
    
    onCash: function() {
        var self = this;
        if ( self.isEditable() ) {
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
    
    printOrder: function() {
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
                '<tr>',
                    '<td>{name}</td>',
                    '<td align="right" width="{priceColWidth}">{[futil.formatFloat(values.subtotal_incl,Config.getDecimals())]}</td>',
                '</tr>',
                '<tr>',
                    '<td colspan="2">',
                        '&nbsp;{[futil.formatFloat(values.qty,Config.getQtyDecimals())]} {[this.getUnit(values.uom_id)]}',
                        '<tpl if="discount"> -{[futil.formatFloat(values.discount,Config.getDecimals())]}%</tpl>',
                    '</td>',        
                '</tr>',
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
                '<tr>',                
                    '<td colspan="2"><hr/></td>',
                '</tr>',
                '<tpl for="o.tax_ids">',
                '<tr>',
                    '<td align="right">inkl. {name}</td>',
                    '<td align="right" width="{priceColWidth}">{[futil.formatFloat(values.amount_tax,Config.getDecimals())]}</td>',        
                '</tr>',
				'</tpl>',
                '</table>',
                profile.receipt_footer || '',
                {
                    getUnit: function(uom_id) {
                        var uom = self.unitStore.getById(uom_id);
                        return uom ? uom.get('name') : '';
                    },
                    getJournal: function(journal_id) {
                        var journal = Config.getJournal(journal_id);
                        return journal ? journal.name : '';
                    }
                }                
            );
        }
        
        // build data
        var data = {
            o: this.order.getData(),
            lines: [],
            priceColWidth: "32%",
            attribWidth: "34%",
            date: futil.strToDate(this.order.get('date'))
        };
        
        self.lineStore.each(function(line) {
           data.lines.push(line.getData()); 
        });
        
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
    },
    
    display: function() {
        var amount_total = this.order ? this.order.get('amount_total') : null;
        if ( amount_total ) {
            Config.display(amount_total.toString());
        } else {
            Config.display("0");
        }
    }
    
});
    