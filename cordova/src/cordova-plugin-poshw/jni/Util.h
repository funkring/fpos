
#ifndef		_UTIL_H
#define		_UTIL_H

#ifndef		UTIL_DATA
#define		UTIL_DATA		extern
#endif

#include	"TypeDefs.h"
#ifdef	__cplusplus
extern "C"
{
#endif

void UTIL_Form_Montant(UCHAR *Mnt_Fmt,unsigned long Montant,UCHAR Pos_Virgule);

#ifdef	__cplusplus
}
#endif

#endif
