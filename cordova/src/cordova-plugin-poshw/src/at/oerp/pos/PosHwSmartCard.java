package at.oerp.pos;

import java.io.IOException;
import java.io.InterruptedIOException;
import java.nio.ByteBuffer;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.cert.CertificateEncodingException;
import java.security.cert.X509Certificate;
import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedList;
import java.util.Locale;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import android.annotation.SuppressLint;
import android.util.Base64;
import android.util.Log;
import at.oerp.smartcard.Card;
import at.oerp.smartcard.CashRegisterSmartCardFactory;
import at.oerp.smartcard.ICashRegisterSmartCard;
import at.oerp.util.BinUtil;

public abstract class PosHwSmartCard extends Card {

	protected final static String TAG = "SmartCard";
	protected ICashRegisterSmartCard driver;
	
	protected String cin = "";
	protected String serial;
	protected SecretKeySpec aesKey;
	protected X509Certificate certicate = null;
	
	protected MessageDigest digest;
	
	protected String  pin = "123456";
	protected boolean noSelect = false;
	protected boolean damaged = false;
	
	protected boolean init = false;
	protected boolean valid = false;
	protected String  initError = null;
	
	protected DateFormat dateFormat;
	protected NumberFormat nf;	
	protected Cipher cipher;
	
	protected ByteBuffer hashBuffer16;
	protected ByteBuffer dataBuffer16;
		
	protected final static int SLEEP_FIRST_TRY = 1000;
	protected final static int SLEEP_SECOND_TRY = 2000;
	
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
	
	public void invalidate() {
		valid = false;
	}
	
	protected void validate() throws IOException {
		try {
			open();
		} catch (IOException e) {
			close();			
			try {
				Thread.sleep(SLEEP_FIRST_TRY);
				try {
					open();					
				} catch (IOException e2 ){
					close();
					Thread.sleep(SLEEP_SECOND_TRY);
					try {
						open();
					} catch (IOException e3) {
						close();
						throw e3;
					}
				}
			} catch ( InterruptedException eInt) {
				Thread.currentThread().interrupt();
				throw new InterruptedIOException();				
			}			
		}
		
		if ( !valid ) {
			cin = driver.getCIN();
			certicate = driver.getCertificate();
			serial = driver.getCertificateSerialHex();
			noSelect = false;
			damaged = false;
			valid = true;
		}		
	}
	
	public String getCertificate() throws IOException {
		validate();
		try {
			return Base64.encodeToString(certicate.getEncoded(), Base64.NO_WRAP);
		} catch (CertificateEncodingException e) {
			throw new IOException(e);
		}
	}
	
	protected byte[] sign(String inValue) throws IOException {
		validate();
		
		digest.reset();
		byte[] sha256Hash = digest.digest(inValue.getBytes());
		
		byte[] signature = null;		
		if ( noSelect ) {
			signature = driver.doSignaturWithoutSelection(sha256Hash, pin);
		} else {			
			signature = driver.doSignatur(sha256Hash, pin);
			noSelect = true;
		}
		
		return signature;
	}
	
	protected String getSuiteID() {
		return "R1-AT1";
	}
	
	
	/**
	 * initialization
	 * @param inKey
	 * @throws IOException
	 */
	@SuppressLint("SimpleDateFormat")
	public void init(String inKey) throws IOException {
		init = false;
		try {
			dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
			nf = NumberFormat.getNumberInstance(Locale.GERMAN);
	        nf.setMinimumFractionDigits(2);
	        nf.setMaximumFractionDigits(2);
	        
	        hashBuffer16 = ByteBuffer.allocate(16);
	        dataBuffer16 = ByteBuffer.allocate(16);
	        
			byte[] rawAesKey = Base64.decode(inKey, Base64.NO_WRAP);
			aesKey = new SecretKeySpec(rawAesKey, "AES");
			try {
				//prepare AES cipher with ECB mode, NoPadding is essential for the
			    // decryption process. Padding could not be reconstructed due
			    // to storing only 8 bytes of the cipher text (not the full 16 bytes)
			    // (or 5 bytes if the mininum turnover length is used)
			    //
			    // Note: Due to the use of ECB mode, no IV is defined for initializing
			    // the cipher. In addition, the data is not enciphered directly. Instead,
			    // the computed IV is encrypted. The result is subsequently XORed
			    // bitwise with the data to compute the cipher text.
				cipher = Cipher.getInstance("AES/CTR/NoPadding", "BC");				
			} catch (NoSuchAlgorithmException e) {
				throw new IOException(e.getMessage(),e);
			} catch (NoSuchProviderException e) {
				throw new IOException(e.getMessage(),e);
			} catch (NoSuchPaddingException e) {
				throw new IOException(e.getMessage(),e);
			}
	
			try {
				digest = MessageDigest.getInstance("SHA-256");
			} catch (NoSuchAlgorithmException e) {
				throw new IOException(e.getMessage(),e);
			}
			initError = null;
			init = true;
		} catch (IOException e) {
			initError = e.getMessage();
			throw e;
		}
	}
	
	/**
	 * init check
	 * @throws IOException
	 */
	protected void initCheck() throws IOException {
		if ( !init ) {
			if ( initError != null ) throw new IOException(initError);
			throw new NoInitException();
		}
	}

	/**
	  * method for AES encryption in CTR mode
	  *
	  * @param concatenatedHashValue
	  * @param turnoverCounter
	  * @param symmetricKey
	  */
	 protected String encryptCTR(final byte[] concatenatedHashValue, double turnover) throws IOException {
		try {
			// reset buffer before reuse
			BinUtil.zero(dataBuffer16);
			BinUtil.zero(hashBuffer16);
			
		    // extract bytes 0-15 from hash value			
			hashBuffer16.put(concatenatedHashValue, 0, 16);
			final byte[] hashBuffer16Raw = hashBuffer16.array();
			final IvParameterSpec ivSpec = new IvParameterSpec(hashBuffer16Raw);
			
			// init cipher
			cipher.init(Cipher.ENCRYPT_MODE, aesKey, ivSpec);
			
		    // put turnover to data buffer
			final long turnoverCounter = (long) (turnover*100.0);
		    dataBuffer16.putLong(turnoverCounter);
		    final byte[] dataBuffer16Raw = dataBuffer16.array();
	
		    // encrypt
		    final byte[] enryptedTurnover = cipher.doFinal(dataBuffer16Raw);
		    
		    // encode only 8 (bytes) the turnover len as base64
		    return Base64.encodeToString(enryptedTurnover, 0, 8, Base64.NO_WRAP);
		}  catch (IllegalBlockSizeException e) {
			throw new IOException(e.getMessage(),e);
		} catch (BadPaddingException e) {
			throw new IOException(e.getMessage(),e);
		} catch (InvalidKeyException e) {
			throw new IOException(e.getMessage(),e);
		} catch (InvalidAlgorithmParameterException e) {
			throw new IOException(e.getMessage(),e);
		}
	}

	
		 
	/**
	 * @param ioReceipt
	 * @return signed receipt
	 * @throws IOException 
	 */
    public PosReceipt signReceipt(PosReceipt ioReceipt) throws IOException {
    	initCheck();
    	
    	// encrypt turnover
    	if ( ioReceipt.specialType != null ) {
    		ioReceipt.encryptedTurnoverValue = Base64.encodeToString(ioReceipt.specialType.getBytes(), Base64.NO_WRAP);
    	} else if ( ioReceipt.encryptedTurnoverValue == null ) {
    		digest.reset();    		
    		String receiptId = ioReceipt.cashBoxID + ioReceipt.receiptIdentifier;
    		byte[] turnoverHash = digest.digest(receiptId.getBytes());
    		ioReceipt.encryptedTurnoverValue = encryptCTR(turnoverHash, ioReceipt.turnover);
    	}
    	
    	// calculate chain value
    	if ( ioReceipt.signatureValuePreviousReceipt == null ) {
    		digest.reset();
    		byte[] prevHash = digest.digest(ioReceipt.prevCompactData.getBytes());
    		ioReceipt.signatureValuePreviousReceipt = Base64.encodeToString(prevHash, 0, 8, Base64.NO_WRAP);
    	}
    	
        //prepare signature payload string for signature creation (Detailspezifikation/ABS 5
    	StringBuilder b = new StringBuilder();
    		b.append("_").append(getSuiteID()); // 0
    		b.append("_").append(ioReceipt.cashBoxID); // 1
    		b.append("_").append(ioReceipt.receiptIdentifier); // 2
    		b.append("_").append(dateFormat.format(ioReceipt.receiptDateAndTime)); // 3
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetNormal)); // 4
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetErmaessigt1)); // 5
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetErmaessigt2)); // 6
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetNull)); // 7
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetBesonders)); // 8
    		b.append("_").append(ioReceipt.encryptedTurnoverValue); // 9
    		b.append("_").append(ioReceipt.signatureCertificateSerialNumber); // 10
    		b.append("_").append(ioReceipt.signatureValuePreviousReceipt);    // 11
    		
    		
    	// build signature
    	ioReceipt.plainData = b.toString();
    	
 		//prepare data to be signed, "ES256 JWS header" fixed (currently the only relevant signature/hash method (RK1)
        String jwsHeaderUrl = "eyJhbGciOiJFUzI1NiJ9";
        String jwsPayloadUrl = Base64.encodeToString(ioReceipt.plainData.getBytes(), Base64.NO_WRAP | Base64.URL_SAFE | Base64.NO_PADDING);
        String jwsDataToBeSigned = jwsHeaderUrl + "." + jwsPayloadUrl;

        // build signature
    	byte[] signature;
    	ioReceipt.valid = false;
        if ( damaged ) {
         	// prepare damaged signature
        	signature = "Sicherheitseinrichtung ausgefallen".getBytes(); 
        } else {
 			try {
 				// try
 				signature = sign(jwsDataToBeSigned);		
 			} catch(IOException e) {
 				Log.e(TAG, "Failed signing, retry 1");
 				close();
 				try {
 					try {
 						Thread.sleep(SLEEP_FIRST_TRY);
 						signature = sign(jwsDataToBeSigned);
 					} catch ( IOException e2 ) {
 						Log.e(TAG, "Failed signing, retry 2");
 						close();
 						Thread.sleep(SLEEP_SECOND_TRY);
 						try {
 							signature = sign(jwsDataToBeSigned);
 						} catch ( IOException e3 ) {
 							Log.e(TAG, "Failed signing, no retry!");
 							damaged = true;
 							close();
 							throw e3;						
 						}
 					}
 				} catch (InterruptedException e1) {
 					Thread.currentThread().interrupt();
 					throw new InterruptedIOException();
 				}			
 			}
 			
 			// mark valid
 			ioReceipt.valid = true;
        }
        
    	// check serial
    	if ( ioReceipt.signatureCertificateSerialNumber != null && ioReceipt.signatureCertificateSerialNumber.equals(serial) )
    		throw new IOException("Invalid Serial: " + ioReceipt.signatureCertificateSerialNumber + " != " + serial);
        
        // store data        
    	ioReceipt.compactData = jwsDataToBeSigned + "." + Base64.encodeToString(signature, Base64.NO_WRAP | Base64.URL_SAFE | Base64.NO_PADDING);
    	ioReceipt.plainData = ioReceipt.plainData + "_" + Base64.encodeToString(signature, Base64.NO_WRAP);
        return ioReceipt;
    }
	
    /**
     * @return test result
     */
	public String test() {
		StringBuilder b = new StringBuilder();
		boolean speedTest = false;
		try {
			
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
			receipt.signatureCertificateSerialNumber = "556809796";
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
			receipt.signatureCertificateSerialNumber = "556809796";
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
			init("gpxHh2p1WGGzcgcn8AFq6IEHY8Lql4/ecm5E/OZVE3c=");
			
			// sign receipts
			PosReceipt lastR = null;
			for ( PosReceipt r : receipts ) {
				if ( lastR != null ) r.prevCompactData = lastR.compactData;
				signReceipt(r);
				b.append(r.plainData).append("\n");
				b.append(r.compactData).append("\n");
				b.append("\n\n");
				lastR = r;				
			}
			
			for ( PosReceipt r : receipts ) {
				Log.i(TAG, r.compactData);
			}
		
			// start speedtest		
			if ( speedTest ) {
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
				b.append("\n");
				long startTime = System.currentTimeMillis();
				int numberOfSignatures = 10;
				byte[] exampleSignature = cashRegisterSmartCard.doSignatur(exampleSha256Hash, pin);
				for (int i = 1; i <= numberOfSignatures; i++) {
					exampleSignature = cashRegisterSmartCard.doSignaturWithoutSelection(exampleSha256Hash, pin);
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
				Log.i(TAG, getCertificate());
			}
		} catch (IOException e) {
			Log.e(TAG, e.getMessage(), e);
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
