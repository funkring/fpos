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
		try {

			synchronized ( this ) {
				if ( service == null ) {
					service = PosHwService.create();	
					service.open();
				}
			}
			
			// print html
			if ( action.equals("printHtml") ) {
				String html = args.getString(0);
				service.getPrinter().printHtml(html);
				callbackContext.success();
			} 
			// status
			else if ( action.equals("getStatus") ) {
				JSONObject status = new JSONObject();
				
				PosHwPrinter printer = service.getPrinter();
				if ( printer != null ) {
					JSONObject printerStatus = new JSONObject();
					printerStatus.put("installed", "true");
					printerStatus.put("type", printer.getType());
					status.put("printer", printerStatus);
				}
				
				callbackContext.success(status);
			}
			
			
		} catch ( Exception e) {
			Log.e(TAG, e.getMessage());
			if ( e instanceof JSONException )
				throw (JSONException) e;
			callbackContext.error(e.getMessage());
		}
		
		return false;
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
