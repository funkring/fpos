package at.oerp.pos;

import java.io.IOException;
import java.security.cert.X509Certificate;

import android.util.Log;
import at.oerp.smartcard.Card;
import at.oerp.smartcard.CashRegisterSmartCardFactory;
import at.oerp.smartcard.ICashRegisterSmartCard;

public abstract class PosHwSmartCard extends Card {

	protected final static String TAG = "SmartCard";
	protected ICashRegisterSmartCard driver;
	
	protected void createDriver() throws IOException {
		try {
			driver = CashRegisterSmartCardFactory.createInstance(this);
			Log.d(TAG, "Smartcard driver loaded");
		} catch ( IOException e ) {
			Log.e(TAG, "Smartcard driver failed!");
			close();
			throw e;
		}
	}
	
	public ICashRegisterSmartCard getDriver() {
		return driver;
	}
	
	public String test() {
		StringBuilder b = new StringBuilder();
		try {
			open();
			ICashRegisterSmartCard cashRegisterSmartCard = getDriver();
			String cin = cashRegisterSmartCard.getCIN();
			b.append("\n");
			b.append("=================================\n");
			b.append("CARD TEST\n");
			b.append("=================================\n");
			b.append("\n");
			b.append("CARD CIN " + cin + "\n");
			X509Certificate cert = cashRegisterSmartCard.getCertificate();
			b.append("CERT SUBJECT " + cert.getSubjectDN() + "\n");
			String certSerialDec = cashRegisterSmartCard.getCertificateSerialDecimal();
			b.append("CERT SERIAL " + certSerialDec + "\n");
			String certSerialHex = cashRegisterSmartCard.getCertificateSerialHex();
			b.append("CERT SERIAL HEX " + certSerialHex +"\n");
			
			byte[] exampleSha256Hash = { (byte) 0xe3, (byte) 0xb0, (byte) 0xc4, 0x42, (byte) 0x98, (byte) 0xfc, 0x1c,
					0x14, (byte) 0x9a, (byte) 0xfb, (byte) 0xf4, (byte) 0xc8, (byte) 0x99, 0x6f, (byte) 0xb9, 0x24,
					0x27, (byte) 0xae, 0x41, (byte) 0xe4, 0x64, (byte) 0x9b, (byte) 0x93, 0x4c, (byte) 0xa4,
					(byte) 0x95, (byte) 0x99, 0x1b, 0x78, 0x52, (byte) 0xb8, 0x55 };
			String exampleCardPIN = "123456";
			b.append("\n");
			long startTime = System.currentTimeMillis();
			int numberOfSignatures = 10;
			byte[] exampleSignature = cashRegisterSmartCard.doSignatur(exampleSha256Hash, exampleCardPIN);
			for (int i = 1; i <= numberOfSignatures; i++) {
				exampleSignature = cashRegisterSmartCard.doSignaturWithoutSelection(exampleSha256Hash, exampleCardPIN);
				b.append("SIGNATURE Created "+ i + " / " + numberOfSignatures + "\n");
			}
			long endTime = System.currentTimeMillis();
			long duration = endTime - startTime;
									
			b.append("\n");			
			b.append(duration / 1000.0 + " Seconds for " + numberOfSignatures + " signatures \n");
			b.append(Math.round(duration / numberOfSignatures) / 1000.0 + " Seconds per signature \n");
			b.append("\n");
			b.append("---------------------------------\n");
			b.append("TEST OK!\n");
			b.append("---------------------------------\n");
			b.append("\n");
		} catch (IOException e) {
			b.append("\n");
			b.append("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
			b.append("Error: " + e.getClass().getSimpleName() + "\n");
			b.append("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
			if ( e.getMessage() != null ) {
				b.append(e.getMessage() + "\n");
				b.append("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
			}
			b.append("\n");			
		} finally {
			close();
		}
		return b.toString();
	}
}
