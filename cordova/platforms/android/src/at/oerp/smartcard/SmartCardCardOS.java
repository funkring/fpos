package at.oerp.smartcard;

import java.io.IOException;
import java.math.BigInteger;
import java.util.List;

import org.spongycastle.cert.X509CertificateHolder;


/**
 * Created by chinnow on 20.10.2015.
 */
public class SmartCardCardOS extends AbstractCashRegisterSmartCard {

	private static final byte[] MASTER_FILE = new byte[] { 0x3F, 0x00 };
	private static final byte[] DF_SIG = new byte[] { (byte) 0xDF, 0x01 };

	private static final byte[] EF_CIN_CSN = new byte[] { (byte) 0xD0, 0x01 };
	private static final byte[] EF_C_CH_DS = new byte[] { (byte) 0xc0, 0x00 };

	private static final byte[] AID_SIG = new byte[] { (byte) 0xD0, 0x40, 0x00, 0x00, 0x22, 0x00, 0x01 };

	public SmartCardCardOS(Card card) throws IOException {
		super(card);
		if (applicationsMissing()) {
			throw new WrongCardException();
		}
	}

	@Override
	public byte[] doSignatur(byte[] sha256Hash, String pin) throws IOException {
		executeSelectWithFileIdAPDU(DF_SIG);
		return doSignaturWithoutSelection(sha256Hash, pin);
	}

	@Override
	public byte[] doSignaturWithoutSelection(byte[] sha256Hash, String pin) throws IOException {
		byte[] ba = SmartCardUtil.getFormat2PIN(pin);
		byte[] data = new byte[] { (byte) 0x00, (byte) 0x20, (byte) 0x00, (byte) 0x81, (byte) 0x08, ba[0], ba[1],
				ba[2], ba[3], ba[4], ba[5], ba[6], ba[7] };
		CommandAPDU command = card.createAPDU(data);
		executeCommand(command);
		command = card.createAPDU(0x00, 0x2A, 0x9E, 0x9A, sha256Hash, 64);
		return getData(command);
	}

	@Override
	public String getCertificateSerialDecimal() throws IOException {
		BigInteger serial = getCertificateSerial();
		return serial.toString();
	}

	@Override
	public String getCertificateSerialHex() throws IOException {

		BigInteger serial = getCertificateSerial();
		return serial.toString(16);
	}

	@Override
	public X509CertificateHolder getCertificate() throws IOException {
		List<byte[]> dataList = getBuffer(false, DF_SIG, EF_C_CH_DS);
		return SmartCardUtil.buildX509Certificate(dataList);
	}

	@Override
	public String getCIN() throws IOException {
		executeSelectWithFileIdAPDU(MASTER_FILE);
		executeSelectWithFileIdAPDU(EF_CIN_CSN);
		CommandAPDU command3 = card.createAPDU(0x00, 0xB0, 0x00, 0x00, 0x08);
		byte[] data = getData(command3);
		String cin = SmartCardUtil.byteArrayToHexString(data);
		return cin;
	}

	private BigInteger getCertificateSerial() throws IOException {

		List<byte[]> dataList = getBuffer(true, DF_SIG, EF_C_CH_DS);
		byte[] ba = dataList.get(0);
		int length = SmartCardUtil.byteToUnsignedInt(ba[14]);
		BigInteger bi = BigInteger.valueOf(0);
		for (int i = 0; i < length; i++) {
			bi = bi.shiftLeft(8).add(BigInteger.valueOf(SmartCardUtil.byteToUnsignedInt(ba[15 + i])));
		}
		return bi;
	}

	private boolean applicationsMissing() throws IOException {

		boolean applicationsMissing = false;
		ResponseAPDU response1 = selectWithAppliactionId(AID_SIG);
		if (response1.getSW() != 0x9000) {
			applicationsMissing = true;
		}
		return applicationsMissing;
	}
}
