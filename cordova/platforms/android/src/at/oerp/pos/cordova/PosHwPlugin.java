package at.oerp.pos.cordova;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwService;

public class PosHwPlugin extends CordovaPlugin {
	
	private String TAG = "PosHwPlugin";
	private PosHwService service;
	
	@Override
	public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
		// test
		if ( action.equals("test") ) {
			callbackContext.success("Test OK!");
			return true;
		} else if ( action.equals("testload")) {
			try {
				synchronized (this) {
					if ( service == null ) {
						service = PosHwService.create();
					}
				}
				callbackContext.success("Load Successful!");
			} catch ( Throwable e) {
				callbackContext.error(e.getMessage());
			}
			return true;
		}
		
		try {

			// create service
			synchronized ( this ) {
				if ( service == null ) {
					service = PosHwService.create();	
					if ( service != null ) {
						service.open();
					}
				}
			}
			
			// print html
			if ( action.equals("printHtml") ) {
				String html = args.getString(0);
				service.getPrinter().printHtml(html);
				callbackContext.success();
				return true;
			} 
			// status
			else if ( action.equals("getStatus") ) {
				if ( service != null ) {
					JSONObject status = new JSONObject();
					PosHwPrinter printer = service.getPrinter();
					if ( printer != null ) {
						JSONObject printerStatus = new JSONObject();
						printerStatus.put("installed", "true");
						printerStatus.put("type", printer.getType());
						status.put("printer", printerStatus);
					}
					callbackContext.success(status);
				} else {
					callbackContext.error("No Service");
				}
				return true;
			} else {
				return false;
			}
			
		} catch ( Throwable e) {
			// log error
			Log.e(TAG, e.getMessage());
			
			// throw before return
			if ( e instanceof JSONException ) {				
				throw (JSONException) e;
			}
			
			// return error via callback
			callbackContext.error(e.getMessage());
			return true;
		}
	}
	
	
	@Override
	public void onStop() {
		synchronized (this) {
			if( service != null ) {
				try {
					service.close();
				} catch ( Exception e) {
					Log.e(TAG, e.getMessage());
				} finally {
					service = null;
				} 
			}
		}
	}
	
	
	
}
