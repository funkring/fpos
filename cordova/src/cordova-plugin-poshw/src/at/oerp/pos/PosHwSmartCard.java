package at.oerp.pos;

import java.io.IOException;
import java.io.InterruptedIOException;
import java.nio.ByteBuffer;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.cert.CertificateEncodingException;
import java.security.cert.X509Certificate;
import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedList;
import java.util.Locale;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
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
	protected String  initError = null;
	
	protected DateFormat dateFormat;
	protected NumberFormat nf;	
	protected Cipher cipher;
	
	protected ByteBuffer hashBuffer16;
	protected ByteBuffer dataBuffer16;
	protected ByteBuffer dataBuffer8;
		
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
		
		String newCIN = driver.getCIN();
		if ( !cin.equals(newCIN) ) {
			certicate = driver.getCertificate();
			serial = driver.getCertificateSerialHex();			
			cin = newCIN;
			noSelect = false;
			damaged = false;
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
		
		if ( digest == null ) {
			try {
				digest = MessageDigest.getInstance("SHA-256");
			} catch (NoSuchAlgorithmException e) {
				throw new IOException(e.getMessage(),e);
			}
		}
		
		digest.reset();
		digest.update(inValue.getBytes());
		byte[] sha256Hash = digest.digest();
		
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
	 * sign data
	 * @param inData
	 * @return
	 * @throws IOException
	 */
	protected String signData(String inData) throws IOException {
		
		//prepare data to be signed, "ES256 JWS header" fixed (currently the only relevant signature/hash method (RK1)
        String jwsHeader = "eyJhbGciOiJFUzI1NiJ9";
        String jwsPayload =  Base64.encodeToString(inData.getBytes(), Base64.NO_WRAP | Base64.URL_SAFE);
        String jwsSignature;
        
        // build signature
        if ( damaged ) {
        	// prepare damaged signature
        	jwsSignature = Base64.encodeToString("Sicherheitseinrichtung ausgefallen".getBytes(), Base64.NO_WRAP | Base64.URL_SAFE);  //create damaged signature part
        } else {
	        String jwsDataToBeSigned = jwsHeader + "." + jwsPayload;
			byte[] signature = null;
			try {
				// try
				signature = sign(jwsDataToBeSigned);			
			} catch(IOException e) {
				close();			
				try {
					try {
						Thread.sleep(SLEEP_FIRST_TRY);
						signature = sign(jwsDataToBeSigned);
					} catch ( IOException e2 ) {
						close();
						Thread.sleep(SLEEP_SECOND_TRY);
						try {
							signature = sign(jwsDataToBeSigned);
						} catch ( IOException e3 ) {
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
			
			// prepare signature
			jwsSignature = Base64.encodeToString(signature, Base64.NO_WRAP | Base64.URL_SAFE);
        }
        
        // build result
        StringBuilder b = new StringBuilder();
        b.append(jwsHeader);
        b.append(".");
        b.append(jwsPayload);
        b.append(".");
        b.append(jwsSignature);
        return b.toString();
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
	        dataBuffer8 = ByteBuffer.allocate(8);
	        
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
				cipher = Cipher.getInstance("AES/ECB/NoPadding", "BC");
				cipher.init(Cipher.ENCRYPT_MODE, aesKey);
			} catch (NoSuchAlgorithmException e) {
				throw new IOException(e.getMessage(),e);
			} catch (NoSuchProviderException e) {
				throw new IOException(e.getMessage(),e);
			} catch (NoSuchPaddingException e) {
				throw new IOException(e.getMessage(),e);
			} catch (InvalidKeyException e) {
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

	/*
	protected String encryptECB(final byte[] concatenatedHashValue, double turnover) throws IOException {
		try {
			long turnoverCounter = (long) (turnover*100.0);
			 
		    // extract bytes 0-15 from hash value
		    final ByteBuffer byteBufferIV = ByteBuffer.allocate(16);
		    byteBufferIV.put(concatenatedHashValue, 0, 16);
		    final byte[] IV = byteBufferIV.array();
	
		    // prepare data
		    // block size for AES is 128 bit (16 bytes)
		    // thus, the turnover counter needs to be inserted into an array of length 16
	
		    //initialisation of the data which should be encrypted
		    final ByteBuffer byteBufferData = ByteBuffer.allocate(16);
		    byteBufferData.putLong(turnoverCounter);
		    final byte[] data = byteBufferData.array();
	
		    //now the turnover counter is represented in two's-complement representation (negative values are possible)
		    //length is defined by the respective implementation (min. 5 bytes)
		    byte[] turnOverCounterByteRep = BinUtil.get2ComplementRepForLong(turnoverCounter,TURN_OVER_COUNTER_LENGTH_IN_BYTES);
	
		    //two's-complement representation is copied to the data array, and inserted at index 0
		    System.arraycopy(turnOverCounterByteRep,0,data,0,turnOverCounterByteRep.length);
		    final byte[] intermediateResult = cipher.doFinal(IV);
		    final byte[] result = new byte[data.length];
	
		    // xor encryption result with data
		    for (int i = 0; i < data.length; i++) {
		      result[i] = (byte) ((data[i]) ^ (intermediateResult[i]));
		    }
	
		    final byte[] encryptedTurnOverValue = new byte[TURN_OVER_COUNTER_LENGTH_IN_BYTES];
	
		    // turnover length is used
		    System.arraycopy(result, 0, encryptedTurnOverValue, 0, TURN_OVER_COUNTER_LENGTH_IN_BYTES);
	
		    // encode result as BASE64
		    return Base64.encodeToString(encryptedTurnOverValue, Base64.NO_WRAP);
		}  catch (IllegalBlockSizeException e) {
			throw new IOException(e.getMessage(),e);
		} catch (BadPaddingException e) {
			throw new IOException(e.getMessage(),e);
		}
	}*/
	
	/**
	  * method for AES encryption in ECB mode
	  *
	  * @param concatenatedHashValue
	  * @param turnoverCounter
	  * @param symmetricKey
	  */
	 protected String encryptECB(final byte[] concatenatedHashValue, double turnover) throws IOException {
		try {
			// reset buffer before reuse
			BinUtil.zero(dataBuffer16);
			BinUtil.zero(hashBuffer16);
			BinUtil.zero(dataBuffer8);
			
		    // extract bytes 0-15 from hash value
			final long turnoverCounter = (long) (turnover*100.0);
			hashBuffer16.put(concatenatedHashValue, 0, 16);
			final byte[] hashBuffer16Raw = hashBuffer16.array();

		    // prepare data
		    // block size for AES is 128 bit (16 bytes)
		    // thus, the turnover counter needs to be inserted into an array of length 16
	
		    //initialisation of the data which should be encrypted
		    dataBuffer16.putLong(turnoverCounter);
		    final byte[] dataBuffer16Raw = dataBuffer16.array();
	
		    // encrypt
		    final byte[] intermediateResult = cipher.doFinal(hashBuffer16Raw);
		    	
		    // xor encryption result with data
		    final byte[] result = dataBuffer8.array();
		    for (int i = 0; i < result.length; i++) {
		    	result[i] = (byte) ((dataBuffer16Raw[i]) ^ (intermediateResult[i]));
		    }
	
		    // encode result as BASE64
		    return Base64.encodeToString(result, Base64.NO_WRAP);
		}  catch (IllegalBlockSizeException e) {
			throw new IOException(e.getMessage(),e);
		} catch (BadPaddingException e) {
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
    		ioReceipt.encryptedTurnoverValue = encryptECB(turnoverHash, ioReceipt.turnover);
    	}
    	
        //prepare signature payload string for signature creation (Detailspezifikation/ABS 5
    	StringBuilder b = new StringBuilder();
    		b.append("_").append(getSuiteID());
    		b.append("_").append(ioReceipt.cashBoxID);
    		b.append("_").append(ioReceipt.receiptIdentifier);
    		b.append("_").append(dateFormat.format(ioReceipt.receiptDateAndTime));
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetNormal));
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetErmaessigt1));
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetErmaessigt2));
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetNull));
    		b.append("_").append(nf.format(ioReceipt.sumTaxSetBesonders));
    		b.append("_").append(ioReceipt.encryptedTurnoverValue);
    		b.append("_").append(ioReceipt.signatureCertificateSerialNumber);
    		b.append("_").append(ioReceipt.signatureValuePreviousReceipt);
    		
    		
    	// build signature
    	ioReceipt.plainData = b.toString();
    	ioReceipt.compactData = signData(ioReceipt.plainData);
    	
    	// check serial
    	if ( ioReceipt.signatureCertificateSerialNumber != null && ioReceipt.signatureCertificateSerialNumber.equals(serial) )
    		throw new IOException("Invalid Serial: " + ioReceipt.signatureCertificateSerialNumber + " != " + serial);
    	
        return ioReceipt;
    }
	
    /**
     * @return test result
     */
	public String test() {
		StringBuilder b = new StringBuilder();
				
		try {
			
			b.append("\n");
			b.append("=================================\n");
			b.append("RECEIPT TEST\n");
			b.append("=================================\n");
			b.append("\n");
			
			PosReceipt receipt = null;
			LinkedList<PosReceipt> receipts = new LinkedList<PosReceipt>();

			receipt = new PosReceipt();
			receipt.cashBoxID = "K1";
			receipt.receiptIdentifier = "1";
			receipt.receiptDateAndTime = new Date();
			receipt.sumTaxSetNormal = 120;
			receipt.sumTaxSetErmaessigt1 = 110;
			receipt.sumTaxSetErmaessigt2 = 113;
			receipt.sumTaxSetNull = 100;
			receipt.sumTaxSetBesonders = 119;
			receipt.turnover = 569.00;
			receipt.signatureValuePreviousReceipt = "K1";
			receipts.add(receipt);
			
			// init encryption
			init("gpxHh2p1WGGzcgcn8AFq6IEHY8Lql4/ecm5E/OZVE3c=");
			
			// sign receipts
			for ( PosReceipt r : receipts ) {
				signReceipt(r);
				b.append(r.plainData).append("\n");
				b.append(r.compactData).append("\n");
				b.append("\n");
			}
			
			// start speedtest			
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
