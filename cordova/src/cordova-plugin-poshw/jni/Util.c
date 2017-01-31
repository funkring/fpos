#include	"Util.h"


void UTIL_Form_Montant(UCHAR *Mnt_Fmt,unsigned long Montant,UCHAR Pos_Virgule)
{
	UCHAR   i;
	UCHAR   j;

		CONV_LongStr(Mnt_Fmt,10,&Montant);
		j = Pos_Virgule;
		for (i=9; j ; i--, j--)
			Mnt_Fmt[i+1] = Mnt_Fmt[i];
		if (Pos_Virgule)
		{
			Mnt_Fmt[i+1] ='.';
			Mnt_Fmt[i+1+Pos_Virgule+1] = 0;
		}
		for(j=0 ; ((j < i) && (Mnt_Fmt[j]=='0')) ; Mnt_Fmt[j++]=' ');
}
