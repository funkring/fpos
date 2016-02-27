/*global Ext:false, Config:false*/
Ext.define('Fpos.model.PosPayment', {
   extend: 'Ext.data.Model',
   config: {
       fields: ['journal',
                'amount',
                'payment']       
   }
});