package at.oerp.payworks;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

import java.math.BigDecimal;
import java.util.EnumSet;

import io.mpos.errors.MposError;
import io.mpos.provider.ProviderMode;
import io.mpos.transactions.Transaction;
import io.mpos.transactions.parameters.TransactionParameters;
import io.mpos.ui.acquirer.ApplicationName;
import io.mpos.ui.shared.MposUi;
import io.mpos.ui.shared.model.MposUiConfiguration;

public class MainActivity extends Activity {

	TextView textInfo;
	EditText inputAmount;
	EditText inputSubject;
	EditText inputId;
	String   lastTransactionId;

	BigDecimal amount;
	String subject;
	String code;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);

		textInfo = (TextView) findViewById(R.id.textInfo);
		inputAmount = (EditText) findViewById(R.id.inputAmount);
		inputSubject = (EditText) findViewById(R.id.inputSubject);
		inputId = (EditText) findViewById(R.id.inputId);

		Button button;

		button = (Button) findViewById(R.id.buttonPay);
		button.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view) {
				payworksPay();
			}
		});

		button = (Button) findViewById(R.id.buttonCancel);
		button.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view) {
				payworksCancel();
			}
		});

		button = (Button) findViewById(R.id.buttonLogout);
		button.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view) {
				payworksLogout();
			}
		});


		MposUi.initialize(this, ProviderMode.TEST, ApplicationName.MCASHIER, "OERP");

		MposUi mposUi = MposUi.getInitializedInstance();
		mposUi.getConfiguration().setDisplayResultBehavior(MposUiConfiguration.ResultDisplayBehavior.CLOSE_AFTER_TIMEOUT);
		//mposUi.getConfiguration().setSignatureCapture(MposUiConfiguration.SignatureCapture.ON_RECEIPT);
		//mposUi.getConfiguration().setSummaryFeatures(EnumSet.of(MposUiConfiguration.SummaryFeature.SEND_RECEIPT_VIA_EMAIL));
	}

	protected void payworksPay() {
		String strAmount = inputAmount.getText().toString();
		subject = inputSubject.getText().toString();
		code = inputId.getText().toString();

		if ( strAmount != null && subject != null && code != null) {
			amount = new BigDecimal(strAmount);

			TransactionParameters transactionParameters = new TransactionParameters.Builder()
					.charge(amount, io.mpos.transactions.Currency.EUR)
					.subject(subject)
					.customIdentifier(code)
					.build();

			MposUi mposUi = MposUi.getInitializedInstance();
			Intent intent = mposUi.createTransactionIntent(transactionParameters);
			startActivityForResult(intent, this.hashCode());
		}
	}

	protected void payworksCancel() {
		if ( lastTransactionId != null && subject != null && code != null ) {
			TransactionParameters transactionParameters = new TransactionParameters.Builder()
					.refund(lastTransactionId)
					.subject(subject)
					.customIdentifier(code)
					.build();


			MposUi mposUi = MposUi.getInitializedInstance();
			Intent intent = mposUi.createTransactionIntent(transactionParameters);
			startActivityForResult(intent, MposUi.REQUEST_CODE_PAYMENT);
		}
	}


	protected JSONObject toJSONError(MposError error) throws JSONException {
		JSONObject res = new JSONObject();
		res.put("name","transaction_error");
		res.put("message",error.getInfo());
		res.put("developerInfo",error.getDeveloperInfo());
		res.putOpt("errorSource",error.getErrorSource());
		res.putOpt("errorType",error.getErrorType());
		return res;
	}

	protected JSONObject toJSONError(String message) throws JSONException {
		JSONObject res = new JSONObject();
		res.put("name","transaction_error");
		res.put("message",message);
		return res;
	}

	protected JSONObject toJSONError(Transaction inTransaction) throws JSONException {
		MposError error = inTransaction != null ? inTransaction.getError() : null;
		if ( error != null ) {
			return toJSONError(error);
		} else {
			return toJSONError("Unable to execute transaction");
		}
	}

	protected JSONObject toJSONTransaction(Transaction inTransaction) throws JSONException {
		JSONObject res = new JSONObject();
		res.put("transactionId", inTransaction.getIdentifier());
		res.put("amount",inTransaction.getAmount().doubleValue());
		res.put("currency",inTransaction.getCurrency());
		res.put("customIdentifier",inTransaction.getCustomIdentifier());
		res.put("subject",inTransaction.getSubject());
		res.put("status",inTransaction.getStatus());
		return res;
	}

	protected void payworksLogout() {
		MposUi mposUi = MposUi.getInitializedInstance();
		mposUi.logout();
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

	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if (requestCode == this.hashCode()) {
			Transaction transaction = MposUi.getInitializedInstance().getTransaction();
			try {

				String infoText = "";
				if (transaction != null) {
					lastTransactionId = transaction.getIdentifier();
					infoText = toJSONTransaction(transaction).toString() + "\n";
				} else {
					lastTransactionId = "Transaktion is Empty!!!\n";
				}

				if (resultCode == MposUi.RESULT_CODE_APPROVED) {

					// Transaction was approved
					Toast.makeText(this, "Transaction approved", Toast.LENGTH_LONG).show();

				} else {

					JSONObject jsonError = toJSONError(transaction);
					infoText += jsonError.toString();

					// Card was declined, or transaction was aborted, or failed
					// (e.g. no internet or accessory not found)
					Toast.makeText(this, "Transaction was declined, aborted, or failed",
							Toast.LENGTH_LONG).show();
				}

				// set text
				textInfo.setText(infoText);
			} catch (JSONException e) {
				textInfo.setText(e.getMessage());
			}

		}
	}
}
