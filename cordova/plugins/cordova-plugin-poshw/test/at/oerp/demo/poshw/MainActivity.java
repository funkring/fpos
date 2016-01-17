package at.oerp.demo.poshw;

import java.io.IOException;

import org.apache.cordova.LOG;

import android.app.Activity;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;
import at.oerp.pos.R;
import at.oerp.pos.WeightResult;



public class MainActivity extends Activity {

	private TextView infoTextView;
	private PosHwService posHw;
	private int displayClick;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		infoTextView = (TextView) findViewById(R.id.infoView);
		infoTextView.setText(Build.MODEL + "\n" + Build.MANUFACTURER);
		
		posHw = PosHwService.create();
		if ( posHw != null ) {
			posHw.open();
		} else {
			infoTextView.setText(infoTextView.getText()+"\nNo Hardware Service");
		}
		
		Button printButton = (Button) findViewById(R.id.printButton);
		printButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				try {
					//posHw.getPrinter().printHtml("TEST<br>Test<br><br>");
					posHw.getPrinter().printTest();
				} catch (IOException e) {
					e.printStackTrace();
				};				
			}
		});
		
		Button weighButton = (Button) findViewById(R.id.weightButton);
		weighButton.setOnClickListener(new OnClickListener() {
			
			@Override
			public void onClick(View v) {
				PosHwScale scale = posHw.getScale();
				try {
					if ( scale.init(11.99f, 0.0f) ) {
						infoTextView.setText("Weighing successful");
						Thread.sleep(2000);
						//showWeighResult();
						new ScaleTask().execute();
					}
				} catch (Exception e) {
					e.printStackTrace();
				} 
				
			}
		});
		
		Button displayButton = (Button) findViewById(R.id.displayButton);
		displayButton.setOnClickListener(new OnClickListener() {
			
			@Override
			public void onClick(View v) {
				displayClick++;
				PosHwDisplay disp = posHw.getCustomerDisplay();
				try {
					disp.setDisplay(Integer.toString(displayClick));
				} catch (IOException e) {
					e.printStackTrace();
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
					e.printStackTrace();
				}				
			}
		});
		
	}
	
	protected void showWeighResult(WeightResult inResult) throws IOException {
		if ( inResult != null ) {
			infoTextView.setText("Gewicht: " + Float.toString(inResult.weight) + "\n" 
					           + "Preis: " + Float.toString(inResult.price) + "\n"
					           + "Total: " + Float.toString(inResult.total));
		} else {
			infoTextView.setText("Weighing...");
		}
	}
	
	
	
	private class ScaleTask extends AsyncTask<Void, WeightResult, Void> {

		@Override
		protected void onProgressUpdate(WeightResult... values) {
			super.onProgressUpdate(values);
			try {
				showWeighResult(values != null && values.length == 1 ? values[0] : null);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		
		@Override
		protected Void doInBackground(Void... params) {
			int fail = 0;
			WeightResult result = new WeightResult();
			try {
				while ( fail < 100) {
					boolean successful =  posHw.getScale().readResult(result);
					if ( successful) {
						fail = 0;
						publishProgress(result);
					} else {
						fail++;
					}
					Thread.sleep(100);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			
			publishProgress(result);
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
