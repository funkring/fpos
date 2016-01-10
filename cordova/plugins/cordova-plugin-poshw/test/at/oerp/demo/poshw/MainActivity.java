package at.oerp.demo.poshw;

import java.io.IOException;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;
import at.oerp.pos.PosHwService;
import at.oerp.pos.R;



public class MainActivity extends Activity {

	private TextView infoTextView;
	private PosHwService posHw;
	
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
