package at.oerp.smartcard;

import java.io.IOException;

import org.spongycastle.cert.X509CertificateHolder;

/**
 * Created by chinnow on 03.05.2016.
 */
public interface ICashRegisterSmartCard {

	byte[] doSignatur(byte[] sha256Hash, String pin) throws IOException;

	byte[] doSignaturWithoutSelection(byte[] sha256Hash, String pin) throws IOException;

	String getCertificateSerialDecimal() throws IOException;

	String getCertificateSerialHex() throws IOException;

	X509CertificateHolder getCertificate() throws IOException;

	String getCIN() throws IOException;

}
