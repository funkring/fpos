package at.oerp.smartcard;

import java.io.IOException;

public class SmartCardException extends IOException {

	private static final long serialVersionUID = 1L;
	
	public SmartCardException() {
		super();
	}

	public SmartCardException(String message, Throwable cause) {
		super(message, cause);
	}

	public SmartCardException(String message) {
		super(message);
	}

	public SmartCardException(Throwable cause) {
		super(cause);
	}

}
