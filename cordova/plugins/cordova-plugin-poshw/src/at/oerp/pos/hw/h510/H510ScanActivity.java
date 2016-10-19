package at.oerp.pos.hw.h510;

import com.wizarpos.barcode.scanner.IScanEvent;
import com.wizarpos.barcode.scanner.ScannerRelativeLayout;
import com.wizarpos.barcode.scanner.ScannerResult;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;
import android.content.res.Resources;
import android.os.Bundle;
import android.view.KeyEvent;
import at.oerp.pos.PosHwScan;

public class H510ScanActivity extends Activity implements PosHwScan  {

	private ScannerRelativeLayout scanner;
	private IScanEvent scanListener;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		// get context
		Application app = this.getApplication();
		Resources res = app.getResources();
		
		// set layout
		int layoutId = res.getIdentifier("activity_h510_scanner", "layout", app.getPackageName());
		setContentView(layoutId);
		
		// config scanner
		int scannerLayoutId = res.getIdentifier("activity_h510_scanner_layout", "id", app.getPackageName());
		scanner = (ScannerRelativeLayout) findViewById(scannerLayoutId);
		scanner.setCameraIndex(0);
		scanListener = new IScanEvent() {
			@Override
			public void scanCompleted(ScannerResult inRes) {
				String text = inRes.getResult();
				if ( text != null && !text.isEmpty() ) {
					String format = inRes.getResultFormat();
					if ( "QR_CODE".equalsIgnoreCase(format) ) {
						finishScan(false, text, format);
					}
				}
			}
		};
		scanner.setScanSuccessListener(scanListener);
	}
	
	protected void finishScan(boolean inCanceled, String inText, String inResult) {		
		if ( inCanceled ) {
			H510ScanActivity.this.setResult(RESULT_CANCELED);
		} else {
			Intent intent = new Intent();		
			intent.putExtra(RESULT_TEXT, inText);
			intent.putExtra(RESULT_FORMAT, inResult);
			H510ScanActivity.this.setResult(RESULT_OK, intent);
		}
		scanner.stopScan();
		finish();
	}
	
	@Override
	protected void onResume() {
		scanner.onResume();
		super.onResume();				
		scanner.startScan();
	}
	
	@Override
	protected void onDestroy() {
		scanner.stopScan();
		super.onDestroy();
	}
	
	
	@Override
	protected void onPause() {
		scanner.onPause();
		super.onPause();
	}
	
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		if ( keyCode == KeyEvent.KEYCODE_BACK ) {
			finishScan(true, null, null);
			return true;
		}
		return super.onKeyDown(keyCode, event);
	}
	
}
