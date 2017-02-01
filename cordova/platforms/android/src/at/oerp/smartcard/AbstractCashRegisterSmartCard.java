package at.oerp.smartcard;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by chinnow on 03.05.2016.
 */
public abstract class AbstractCashRegisterSmartCard implements ICashRegisterSmartCard {

	protected Card card;
	
	protected AbstractCashRegisterSmartCard(Card inCard) {
		card = inCard;
	}

	protected void executeSelectWithFileIdAPDU(byte[] fileID) throws IOException {

		CommandAPDU select = card.createAPDU(0x00, 0xA4, 0x00, 0x0C, fileID);
		executeCommand(select);
	}

	protected ResponseAPDU selectWithAppliactionId(byte[] appliactionId) throws IOException {
		CommandAPDU select = card.createAPDU(0x00, 0xA4, 0x04, 0x0C, appliactionId);
		return executeCommand(select);
	}

	protected ResponseAPDU executeCommand(CommandAPDU commandAPDU) throws IOException {

		ResponseAPDU responseAPDU = null;
		try {
			responseAPDU = card.transmit(commandAPDU);
			if (responseAPDU.getSW() != 0x9000 && responseAPDU.getSW() != 0x6A82) {
				throw new IOException("Response APDU status is " + responseAPDU.getSW());
			}
		} catch (Exception e) {
			throw new IOException(e);
		}
		return responseAPDU;
	}

	protected byte[] getData(CommandAPDU commandAPDU) throws IOException {

		try {
			ResponseAPDU responseAPDU = card.transmit(commandAPDU);
			if (responseAPDU.getSW() != 0x9000) {
				throw new IOException("Response APDU status is " + responseAPDU.getSW());
			} else {
				return responseAPDU.getData();
			}
		} catch (Exception e) {
			throw new IOException(e);
		}
	}
   
	
	protected List<byte[]> getBuffer(boolean onlyFirst, byte[] DF, byte[] EF) throws IOException  {
		// other wise to normal
		executeSelectWithFileIdAPDU(DF);
		executeSelectWithFileIdAPDU(EF);
		int offset = 0;
		int blockSize = card.getBlockSize();		
		List<byte[]> dataList = new ArrayList<byte[]>(8);
		ResponseAPDU resp = null;
		while (true) {
			resp = card.transmit(card.createAPDU(0x00, 0xB0, 0x7F & (offset >> 8), offset & 0xFF, blockSize));
			if (resp.getSW() != 0x9000) {
				break;
			}
			dataList.add(resp.getData());
			if (onlyFirst) {
				break;
			}
			offset += blockSize;
		}
		if ( dataList.isEmpty() ) {
			String respCode = resp != null ? Integer.toString(resp.getSW()) : "";
			throw new IOException("getBuffer() returned empty! Last response " + respCode);
		}
		return dataList;
	}

	/*
	protected List<byte[]> getBuffer(boolean onlyFirst, byte[] DF, byte[] EF) throws IOException  {
		// other wise to normal
		executeSelectWithFileIdAPDU(DF);
		executeSelectWithFileIdAPDU(EF);
		int offset = 0;
		List<byte[]> dataList = new ArrayList<byte[]>(8);
		while (true) {
			ResponseAPDU resp = card.transmit(new CommandAPDU(0x00, 0xB0, 0x7F & (offset >> 8), offset & 0xFF, 256));
			if (resp.getSW() != 0x9000) {
				break;
			}
			dataList.add(resp.getData());
			if (onlyFirst) {
				break;
			}
			offset += 256;
		}
		return dataList;
	}*/
}
