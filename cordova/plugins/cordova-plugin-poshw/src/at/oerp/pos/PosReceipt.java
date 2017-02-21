package at.oerp.pos;

import java.util.Date;

/**
 * This class represents the data structure that is specified in Detailspezifikation Abs 4
 * For signature generation the data is prepared according to Detailspezifikation Abs 5
 */
public class PosReceipt {
    //REF TO SPECIFICATION: Detailspezifikation/Abs 4, Abs 5

    //@JsonProperty("Kassen-ID")
    public String cashBoxID;

    //@JsonProperty("Belegnummer")
    public String receiptIdentifier;

    //@JsonProperty("Beleg-Datum-Uhrzeit")
    public Date receiptDateAndTime;

    //@JsonProperty("Betrag-Satz-Normal")
    public double sumTaxSetNormal;

    //@JsonProperty("Betrag-Satz-Ermaessigt-1")
    public double sumTaxSetErmaessigt1;

    //@JsonProperty("Betrag-Satz-Ermaessigt-2")
    public double sumTaxSetErmaessigt2;

    //@JsonProperty("Betrag-Satz-Null")
    public double sumTaxSetNull;

    //@JsonProperty("Betrag-Satz-Besonders")
    public double sumTaxSetBesonders;

    //@JsonProperty("Stand-Umsatz-Zaehler-AES256-ICM")
    public String encryptedTurnoverValue;
    
    // special type value
    public String specialType;
    
    // unencrypted turnover
    public double turnover;

    //@JsonProperty("Zertifikat-Seriennummer")
    public String signatureCertificateSerialNumber;

    //@JsonProperty("Sig-Voriger-Beleg")
    public String signatureValuePreviousReceipt;
    
    // plain data
    public String plainData;
    
    // compact data
    public String compactData;
    
    // previous compact data
    public String prevCompactData;
    
    // valid
    public boolean valid;
  
}
