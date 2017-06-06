package at.oerp.demo.poshw;

import java.io.IOException;
import java.security.cert.X509Certificate;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedList;
import java.util.Random;

import android.app.Activity;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TabHost;
import android.widget.TextView;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwScan;
import at.oerp.pos.PosHwService;
import at.oerp.pos.PosHwSmartCard;
import at.oerp.pos.PosReceipt;
import at.oerp.pos.R;
import at.oerp.pos.WeightResult;
import at.oerp.pos.hw.android.BTPrinterInterface;
import at.oerp.pos.hw.android.BasicPrinter;



public class MainActivity extends Activity {

	private final static String TAG = "TEST";
	
	private TextView infoTextView;
	private PosHwService posHw;
	private ScaleTask scaleTask;
	private Random random;
	private BasicPrinter btPrinter;
	
	private final static int REQUEST_SCAN = 1;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		
		infoTextView = (TextView) findViewById(R.id.infoView);
		show(Build.MODEL + "\n" + Build.MANUFACTURER);
		random = new Random();
		
		TabHost host = (TabHost) findViewById(R.id.tabHost);
		host.setup();
		
		// Tab 1
		TabHost.TabSpec spec = host.newTabSpec("Print");
		spec.setContent(R.id.tabPrint);
		spec.setIndicator(spec.getTag());
		host.addTab(spec);
		
		// Tab 2
		spec = host.newTabSpec("Card");
		spec.setContent(R.id.tabCard);
		spec.setIndicator(spec.getTag());
		host.addTab(spec);
		
		// Tab 3
		spec = host.newTabSpec("Other");
		spec.setContent(R.id.tabOther);
		spec.setIndicator(spec.getTag());
		host.addTab(spec);
		
		
		posHw = PosHwService.create(getApplication());
		if ( posHw != null ) {
			posHw.open();
		} else {
			show(infoTextView.getText()+"\nNo Hardware Service");
		}
		
		Button printButton = (Button) findViewById(R.id.printButton);
		printButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				try {
					String test =
							   "<br>Zeile1" +
							   "<br>Zeile2" +
							   "<br>Zeile3" +
							   "<br>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" +
							   "<br>----------------------------------------------------" +
							   "<br>xyz12345abcdefghijklmnopxyz12345abcdefghijklmnopxyz1" +
							   "<br>Wielange darf eine Zeile sein damit sie sich ausgeht" +
			                   "<br>um zu testen ob der Druck" +
			                   "<br>funktioniert"+
			                   "<p>Ein Text</p>"+
			                   "<p style=\"font-size: large;\">Large</p>"+
			                   "<img src=\"qrcode\" alt=\"_R1-AT1_K1_4638_2017-02-21T14:58:32_0,00_0,00_0,00_0,00_0,00_cw==_556809796_uttyg3ZqESo=_YsyLovED2bTiP+LpzSF3Z3ltNaFSO7Mldgd4j4L2OduqpLGbU3sRIiC721EVdBBx3g1ft7mDQc5kJl1CODsucQ==\">" +
			                   "<p>Danach noch ein Text</p>" +
			                   "<p style=\"font-size: larger;\">Larger</p>" +
							   "<p>Danach noch ein Text</p>" +
							   "<p style=\"font-size: medium;\">Medium</p>" +
							   "<p>Danach noch ein Text</p>";
			                   //"<p style=\"font-size: large;\">Großer Text</p>" +
			                   
					posHw.getPrinter().printHtml(test);
					//posHw.getPrinter().printTest();
				} catch (IOException e) {
					handleError(e);
				};				
			}
		});
		
		Button weighButton = (Button) findViewById(R.id.weightButton);
		weighButton.setOnClickListener(new OnClickListener() {
			
			@Override
			public void onClick(View v) {
				try {
					float price = (float) (Math.random()*20.0);
					if ( scaleTask == null ) {
						scaleTask = new ScaleTask(price, 0.0f);						
						scaleTask.execute();
					} else {
						scaleTask.price = price;
						scaleTask.init = true;
					}
				} catch (Exception e) {
					handleError(e);
				} 
				
			}
		});
		
		Button displayButton = (Button) findViewById(R.id.displayButton);
		displayButton.setOnClickListener(new OnClickListener() {
			
			@Override
			public void onClick(View v) {
				PosHwDisplay disp = posHw.getCustomerDisplay();
				if ( disp != null ) {
					double displayVal = Math.round((random.nextDouble()*1000)*100)/100.0;
					try {
						if ( disp.fullCharset() ) {
							disp.setDisplay(String.format("%1$,.2f €", displayVal));
						} else {
							disp.setDisplay(Double.toString(displayVal));
						}
					}  catch (IOException e) {
						handleError(e);
					}
				}
			}
		});
		
		Button openButton = (Button) findViewById(R.id.openButton);
		openButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				try {
					posHw.openCashDrawer();
				} catch (IOException e) {
					handleError(e);
				}				
			}
		});
		
		
		Button provisionButton = (Button) findViewById(R.id.provisioningButton);
		provisionButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				try {
					posHw.provisioning();
				} catch (IOException e) {
					handleError(e);
				}				
			}
		});
		
		Button btOpenButton = (Button) findViewById(R.id.openBTButton);
		btOpenButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				if ( btPrinter == null ) {
					btPrinter = BTPrinterInterface.create(posHw);
					if ( btPrinter != null ) {
						log("Bluetooth printer opened");
					} else {
						log("No printer found!");
					}
				}
			}
		});
		
		Button btPrintButton = (Button) findViewById(R.id.printBTButton);
		btPrintButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				if ( btPrinter != null ) {
					String test =
							   "<br>Zeile1" +
							   "<br>Zeile2" +
							   "<br>Zeile3" +
							   "<br>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" +
							   "<br>----------------------------------------------------" +
							   "<br>xyz12345abcdefghijklmnopxyz12345abcdefghijklmnopxyz1" +
							   "<br>Wielange darf eine Zeile sein damit sie sich ausgeht" +
			                   "<br>um zu testen ob der Druck" +
			                   "<br>funktioniert"+
			                   "<br><br><br><br><br><br>";
					try {
						btPrinter.printHtml(test);
						log("Bluetooth printed");
					} catch (IOException e) {
						handleError(e);
					}
				}
			}
		});
		
		
		Button btCloseButton = (Button) findViewById(R.id.closeBTButton);
		btCloseButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				if ( btPrinter != null ) {
					btPrinter.close();
					btPrinter = null;
					log("Bluetooth printer closed");
				}
			}
		});
		
		Button btScanButton = (Button) findViewById(R.id.scanButton);
		btScanButton.setOnClickListener(new OnClickListener() {
			
			@Override
			public void onClick(View v) {
				Class<? extends Activity> activityClass = posHw.getScanActivity();				
				Intent intent = new Intent(MainActivity.this.getApplicationContext(), activityClass);				
				startActivityForResult(intent, REQUEST_SCAN);
				
			}
		});
		
		
		Button smartcardButton = (Button) findViewById(R.id.smartcardButton);
		smartcardButton.setOnClickListener(new OnClickListener() {		
			@Override
			public void onClick(View v) {
				try {
					testSmartCard();
				} catch ( Throwable e) {
					Log.e(TAG, e.getMessage(), e);
				}
			}
		});
		
		Button testReceiptButton = (Button) findViewById(R.id.smartcardTestButton);
		testReceiptButton.setOnClickListener(new OnClickListener() {			
			@Override
			public void onClick(View v) {
				try {
					testSmartCardReceipt();
				} catch (IOException e) {
					Log.e(TAG, e.getMessage(), e);
				}				
			}
		});
		
		
		Button beepButton = (Button) findViewById(R.id.beepButton);
		beepButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				try {
					posHw.beep();
				} catch (IOException e) {
					Log.e(TAG, e.getMessage(), e);
				}				
			}
		});
		
	}
	
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if ( requestCode == REQUEST_SCAN ) {
			if ( resultCode == RESULT_OK ) {
				show(data.getStringExtra(PosHwScan.RESULT_TEXT) + "\n" + data.getStringExtra(PosHwScan.RESULT_TEXT));
			}
		}		
	}
	
	protected void setResultText(String inText) {
		if ( inText == null ) inText = "";		
		infoTextView.setText(inText);
	}
	
	
	protected void handleError(Throwable e) {
		e.printStackTrace();
	}
	
	protected void show(String inText) {
		infoTextView.setText(inText);
	}
	
	protected void log(String inText) {
		if ( inText != null ) {
			CharSequence curText = infoTextView.getText();			
			if ( curText == null ) {
				infoTextView.setText(inText);
			} else {
				StringBuilder b = new StringBuilder(curText);
				b.append("\n");
				b.append(inText);
				infoTextView.setText(b.toString());
			}
		}
	}
	
	protected void showWeighResult(WeightResult inResult) throws IOException {
		if ( inResult != null ) {
			show("Gewicht: " + Float.toString(inResult.weight) + "\n" 
			    + "Preis: " + Float.toString(inResult.price) + "\n"
			    + "Total: " + Float.toString(inResult.total));
		} else {
			show("Weighing...");
		}
	}
	
	protected void testSmartCard() throws IOException {
		String result = posHw.getSmartCard().test();
		setResultText(result);
	}
	
	protected void testSmartCardReceipt() throws IOException {
		PosHwSmartCard card = posHw.getSmartCard();
		if ( card == null ) {
			setResultText("SmartCard not supported");
			return;
		}
		
		StringBuilder b = new StringBuilder();
		b.append("\n");
		b.append("=================================\n");
		b.append("RECEIPT TEST\n");
		b.append("=================================\n");
		b.append("\n");
		
		Calendar cal = Calendar.getInstance();
		cal.setTime(new Date());
		cal.add(Calendar.HOUR, -8);
		
		PosReceipt receipt = null;
		LinkedList<PosReceipt> receipts = new LinkedList<PosReceipt>();

		receipt = new PosReceipt();
		receipt.cashBoxID = "K1";
		receipt.receiptIdentifier = "1";
		receipt.receiptDateAndTime = cal.getTime();
		receipt.sumTaxSetNormal = 0;
		receipt.sumTaxSetErmaessigt1 = 0;
		receipt.sumTaxSetErmaessigt2 = 0;
		receipt.sumTaxSetNull = 0;
		receipt.sumTaxSetBesonders = 0;
		receipt.turnover = 0.00;
		receipt.prevCompactData = "K1";
		receipt.signatureCertificateSerialNumber = "21303e44";
		receipts.add(receipt);
		
		receipt = new PosReceipt();
		cal.add(Calendar.HOUR, 1);
		receipt.cashBoxID = "K1";
		receipt.receiptIdentifier = "2";
		receipt.receiptDateAndTime = cal.getTime();
		receipt.sumTaxSetNormal = 120.0;
		receipt.sumTaxSetErmaessigt1 = 110.0;
		receipt.sumTaxSetErmaessigt2 = 113.0;
		receipt.sumTaxSetNull = 100;
		receipt.sumTaxSetBesonders = 119.0;
		receipt.turnover = 562.00;
		receipt.signatureCertificateSerialNumber = "21303e44";
		receipts.add(receipt);
		
		/*
		receipt = new PosReceipt();
		receipt.cashBoxID = "K1";
		receipt.receiptIdentifier = "4";
		receipt.receiptDateAndTime = new Date();
		receipt.sumTaxSetNormal = 12;
		receipt.sumTaxSetErmaessigt1 = 11;
		receipt.sumTaxSetErmaessigt2 = 11;
		receipt.sumTaxSetNull = 10;
		receipt.sumTaxSetBesonders = 11;
		receipt.turnover = 100.00;
		receipt.signatureCertificateSerialNumber = "556809796";
		receipts.add(receipt);*/
		
		// init encryption
		card.init("gpxHh2p1WGGzcgcn8AFq6IEHY8Lql4/ecm5E/OZVE3c=");
		
		// sign receipts
		PosReceipt lastR = null;
		for ( PosReceipt r : receipts ) {
			if ( lastR != null ) r.prevCompactData = lastR.compactData;
			card.signReceipt(r);
			b.append(r.plainData).append("\n");
			b.append(r.compactData).append("\n");
			b.append("\n\n");
			lastR = r;				
		}
		
		for ( PosReceipt r : receipts ) {
			Log.i(TAG, r.compactData);
		}
		
		setResultText(b.toString());
	
	}
	
	
	private class ScaleTask extends AsyncTask<Void, WeightResult, Void> {

		float price;
		float tara;
		boolean init;
		
		public ScaleTask(float inPrice, float inTara) {
			super();
			price = inPrice;
			tara = inTara;
			init = true;
		}
		
		@Override
		protected void onProgressUpdate(WeightResult... values) {
			super.onProgressUpdate(values);
			try {
				if ( values != null) {
					for ( WeightResult value : values) {
						showWeighResult(value);
					}
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		
		@Override
		protected Void doInBackground(Void... params) {
			WeightResult result = new WeightResult();
			try {				
				while ( !isCancelled() ) {
					if ( init ) {
						if ( posHw.getScale().init(price, tara) ) {
							init = false;
						}
					} else {
						boolean successful =  posHw.getScale().readResult(result);
						if ( successful) {
							if ( result.price != price) {
								init = true;
							} 
							publishProgress(result);
						}
						Thread.sleep(250);
					}
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			return null;
		}
		
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		if (id == R.id.action_settings) {
			return true;
		}
		return super.onOptionsItemSelected(item);
	}
}
