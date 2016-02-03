/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.OrderViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.Config',
        'Ext.proxy.PouchDBUtil',
        'Fpos.view.OrderView'
    ],
    config: {
        refs: {
            orderView: '#orderView',
            posDisplay: '#posDisplayLabel'        
        },
        control: {     
            orderView: {
                initialize: 'orderViewInitialize'
            },
            posDisplay: {
                initialize: 'posDisplayInitialize'
            }
        }
    },
    
    init: function() {
        this.order = null;
        this.lineStore = Ext.StoreMgr.lookup("PosLineStore");
        this.orderStore = Ext.StoreMgr.lookup("PosOrderStore");
        this.taxStore = Ext.StoreMgr.lookup("AccountTaxStore");
        this.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");
    },    
    
    posDisplayInitialize: function(display) {
        display.setTpl(Ext.create('Ext.XTemplate',
            '{amount_total} {[Config.getCurrency()]}'
        ));
    },
    
    orderViewInitialize: function() {
        var self = this;
        
        // global event after sync
        Ext.Viewport.on({
            scope: self,
            reloadData: self.reloadData,
            productInput: self.productInput
        }); 
        
        // reload data
        self.reloadData();
    },
    
    productInput: function(product) {
        
    },
    
    // compute line values
    validateLine: function(line, taxes, taxlist) {
       var self = this;
       
       var price = line.get('price_brutto') || 0.0;

       var discount = line.get('discount') || 0.0;
       discount = 1.0 - (discount/100.0);
       
       var qty = line.get('qty') || 0.0;
       var total = qty * price * discount;
       var tax_ids = line.get('tax_ids');

       if ( taxes ) 
            taxes = {};
            
       var tax_percent = 0.0;
       var tax_fixed = 0.0;
       var total_tax = 0.0;
       
       Ext.each(tax_ids, function(tax_id) {
            var tax = taxes.get(tax_id);
            if ( !tax ) {
                var taxDef = self.taxStore.getById(tax_id);
                
                var taxsum = {
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
            
            if (tax.type === 'percent') {
                tax_percent += tax.amount;
            } else if (tax.type === 'fixed') {
                tax_fixed += (tax.amount * qty);
            }                  
        });
               
        // subtotal without tax
        var total_netto = (total-tax_fixed) / (1.0 + tax_percent);

        // sum tax
        Ext.each(tax_ids, function(tax_id) {
            var tax = taxes.get(tax_id);
            var amount_tax = 0.0;       
            if (tax.type === 'percent') {
                amount_tax = total_netto * (1.0 + tax.amount);
            } else if (tax.type === 'fixed') {
                amount_tax = (tax.amount * qty);
            }   
            tax.sum.amount_tax += amount_tax;
            total_tax += amount_tax;
        });
        
        // set subtotal if dirty
        if ( line.isDirty() ) {
            line.set('subtotal_incl', total);
            line.save();
        }
        
        // return subtotal brutto and amount tax
        return { subtotal_incl: total, 
                 amount_tax:  total_tax };
    },
    
    // validate lines of current order
    validateLines: function() {
        var self = this;
        if ( !self.order || self.order.state !== 'draft')
            return;
            
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
        
        // save if dirty
        if ( self.order.isDirty() ) {
            self.order.save();
        }
    },
    
    // set current order
    setOrder: function(order) {
        var self = this;
        
        self.order = order;    
        self.getPosDisplay().setRecord(order);
        
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
    
    reloadData: function() {
        var self = this;

        var db = Config.getDB();
        var user = Config.getUser();
        
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
    }
    
});
    