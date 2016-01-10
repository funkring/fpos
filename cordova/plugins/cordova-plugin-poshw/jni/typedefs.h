
#if	!defined(_TYPEDEFS)
#define	_TYPEDEFS
//#pragma pack(1)

typedef char					CHAR;
typedef char*					PSTR;
typedef char*					LPSTR;

typedef	unsigned char       			UCHAR;
typedef	unsigned char       			uchar;
typedef	unsigned short int           		USHORT;
typedef	short int           			SHORT;
typedef	int           				INT;
typedef	unsigned int  				UINT;
typedef long					LONG;
typedef	unsigned long       			ULONG;
typedef UCHAR*					FPTR;
typedef UCHAR*					PUCHAR;
typedef UCHAR*					LPBYTE;
typedef float					FLOAT;
typedef double					DOUBLE;
typedef long double				LDOUBLE;



typedef void					VOID;

typedef	char                    INT8;       /* Signed 8-bit integer */
typedef	unsigned char           UINT8;      /* Unsigned 8-bit integer */
typedef	short int               INT16;      /* Signed 16-bit integer */
typedef	unsigned short int      UINT16;     /* Unsigned 16-bit integer	*/
typedef	long int                INT32;      /* Signed 32-bit integer */
typedef	unsigned long int       UINT32;     /* Unsigned 32-bit integer */

typedef	float                   FLOAT32;    /* 32-bit IEEE single precision */
typedef	double                  FLOAT64;    /* 64-bit IEEE double precision */
typedef	long double             FLOAT80;    /* 80-bit IEEE max precision */

typedef	void*              PTR;        /* Pointer to any data type */
typedef	UINT8*             PTR8;       /* Pointer to 8-bit data */
typedef	UINT16*            PTR16;      /* Pointer to 16-bit data */
typedef	UINT32*            PTR32;      /* Pointer to 32-bit data */


typedef unsigned char			BYTE;       /* 8-bit data */
typedef	unsigned short int      WORD;       /* 16-bit data */
typedef	unsigned long int       DWORD;      /* 32-bit data */

typedef BYTE*					BYTE_PTR;   /* Pointer to 8-bit data */
typedef	WORD*              WORD_PTR;   /* Pointer to 16-bit data */
typedef	DWORD*             DWORD_PTR;  /* Pointer to 32-bit data */

#define RecordLength	110
typedef const unsigned char MenuString [23];
typedef UCHAR RecordString [RecordLength];

#define	lowbyte(word)        ((word) & 0xff)
#define	highbyte(word)       lowbyte((word) >> 8)
#define	dim(x)               (sizeof(x) / sizeof(x[0]))
#define	setvect(inum,addr)  *((ISRP  *) ((inum) * 4)) = ((ISRP) addr)
#define	getvect(inum)        (ISRP) (*((ISRP  *) ((inum) * 4)))

#if	!defined(min)
#define max(a,b)             (((a) > (b)) ? (a) : (b))
#define min(a,b)             (((a) < (b)) ? (a) : (b))
#endif

#undef NULL
#ifdef __cplusplus
#define		NULL		0
#else
#define		NULL		((void*)0)
#endif

#define OFF			0
#define ON			1

#define NO			0
#define YES			1             

#define OK			0
#define ERROR				-1
#define TIMEOUT				-2

#define CONTINUE	0
#define CANCEL				-3
#define ERROR_CONN			-4
#define ERROR_SEND			-5
#define ERROR_RECV			-6

#define BOOL UCHAR
#define TRUE		1
#define true		1
#define FALSE       0
#define false       0

#define ERROR		-1
#define USER_ESCAPE	-2

#define  TEXTOUT_START         9
#define  TEXTOUT_CONN           0
#define  TEXTOUT_END             1

#define ULONG_C51 unsigned long
#define UINT_C51 unsigned int

//#define ASCII_FONT  0
//#define GB2312_FONT 1
typedef enum  {ASCII_FONT,GB2312_FONT} FONT;

#endif	/* !defined(_TYPEDEFS) */

