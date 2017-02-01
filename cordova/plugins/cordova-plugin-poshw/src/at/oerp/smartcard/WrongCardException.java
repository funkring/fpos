package at.oerp.smartcard;

public class WrongCardException extends SmartCardException{

	private static final long serialVersionUID = -9060593530091390863L;

	public WrongCardException() {
		super("wrong card");
	}
}
