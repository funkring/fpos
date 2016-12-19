---
title: Payworks
description: Payworks cash machine implementation 
---

|Android 4.2|
|:-:|
|Supported|

# cordova-plugin-payworks

This plugin defines a global `window.Payworks` object, which provides an API for making payments with the Payworks API


## Installation

This requires cordova 6.0+

   cordova plugin add https://github.com/funkring/cordova-plugin-payworks.git

## Examples

### Initialisation for SIX mCashier

```js

window.Payworks.init({
  mode: 'TEST',
  appName: 'MCASHIER',
  integrator: 'OERP.AT'
}, function() {
   // success
}, function(err) {
   // failed
});


```

### Payment

```js

window.Payworks.payment({
  amount: 10.0,
  currency: 'EUR',
  subject: 'Payment K1/0001',
  customId: 'K1/0001'
}, function(res) {
  // successful payment
  var transactionId = res.transactionId;
}, function(err) {
  // payment failed
});

```

### Payment cancellation

```js

window.Payworks.cancelPayment({
  transactionId: xxx,
  subject: 'Cancellation K1/0001',
  customId: 'K2/0002'
}, function(res) {
  // successful cancellation
  var transationId = res.transactionId;
}, function(err) {
  // cancellation failed
});
```

### Logout

With the first payment, an automatic login form is shown. The credentials are stored
permanent until a logout was done. 

```js

window.Payworks.logout(function() {
 // logout successful
}, 
function(err) {
 // logout failed
});

```
