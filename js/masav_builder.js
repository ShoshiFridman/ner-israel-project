const fs = require('fs');

/* ========= פונקציות עזר ========= */
const STR_PAD_LEFT = 0;

function strrev(str) {
  return String(str).split('').reverse().join('');
}

function mstr_pad(str, length, pad_string = '0', pad_type = STR_PAD_LEFT) {
  str = String(str !== undefined && str !== null ? str : '');
  if (str.length > length) {
    return str.substring(0, length);
  }
  return str.padStart(length, pad_string);
}

/* ========= מחלקת MSV ========= */
class msvwriter {
  constructor() {
    this.bank_field = 'בנק';
    this.branch_field = 'סניף';
    this.account_field = 'חשבון';
    this.id_field = 'תז';
    this.reference_field = 'id';
    this.name_field = 'שם';
    this.sum_field = 'סכום';
    this.mosad = '';
    this.mosadname = '';
    this.date = null;
    this.tcount = 0;
    this.sumag = 0;
    this.sugtnua = 'זיכוי';
    this.revname = false;
  }

  setmsvconfig(mosad, mosadname, date) {
    this.mosad = mosad;
    this.mosadname = mosadname;
    this.date = date
      ? new Date(date).getTime() / 1000
      : Date.now() / 1000;
  }

  createmsv(usersdata) {
    if (!usersdata || usersdata.length === 0) {
      //console.log("DEBUG: usersdata empty!");
      return '';
    }

    //console.log("DEBUG: creating MSV for", usersdata.length, "rows");
    //console.log("DEBUG: first row:", usersdata[0]);

    let s = '';
    s += this.koteret();
    this.sumag = 0;
    this.tcount = 0;

    for (const line of usersdata) {
      // בדיקת שדות חובה
      const required = [
        this.bank_field, this.branch_field, this.account_field,
        this.id_field, this.name_field, this.sum_field, this.reference_field
      ];
      for (const field of required) {
        if (!(field in line)) {
          //console.log(`DEBUG: missing field ${field} in line:`, line);
        }
      }

      // המרה לסכום מספרי
      const sumValue = Number(line[this.sum_field] !== undefined && line[this.sum_field] !== null ? line[this.sum_field] : 0);
      if (isNaN(sumValue) || sumValue === 0) {
        //console.log("DEBUG: skipping row because sum is 0 or NaN:", line);
        continue;
      }

      s += this.tnua(line);
      this.sumag += Math.round(sumValue * 100);
      this.tcount++;
    }

    s += this.sicum();
    s += '9'.repeat(128) + '\n';
    return s;
  }

  koteret() {
    const date = new Date(this.date * 1000);
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    let s = '';
    s += 'K';
    s += this.mosad;
    s += '00';
    s += y + m + d;
    s += '0';
    s += '001';
    s += '0';
    s += y + m + d;
    s += this.mosad.substring(0, 5);
    s += '000000';
    s += this.mosadname.padStart(30, ' ');
    s += ' '.repeat(56);
    s += 'KOT\n';
    return s;
  }

  tnua(line) {
    const sumag = Math.round(Number(line[this.sum_field] !== undefined && line[this.sum_field] !== null ? line[this.sum_field] : 0) * 100);
    let s = '';
    s += '1';
    s += this.mosad;
    s += '00';
    s += '000000';
    s += mstr_pad(line[this.bank_field], 2);
    s += mstr_pad(line[this.branch_field], 3);
    s += '0000';
    s += mstr_pad(line[this.account_field], 9);
    s += '0';
    s += mstr_pad(line[this.id_field], 9);
    s += strrev(String(line[this.name_field]).substring(0, 16)).padStart(16, ' ');
    s += mstr_pad(sumag, 13);
    s += mstr_pad(line[this.reference_field], 20);
    s += '00000000';
    s += '000';
    s += '006';
    s += '0'.repeat(18);
    s += '  \n';
    return s;
  }

  sicum() {
    const date = new Date(this.date * 1000);
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    let s = '';
    s += '5';
    s += this.mosad;
    s += '00';
    s += y + m + d;
    s += '0';
    s += '001';
    s += String(this.sumag).padStart(15, '0');
    s += '0'.repeat(15);
    s += String(this.tcount).padStart(7, '0');
    s += '0'.repeat(7);
    s += ' '.repeat(63);
    return s + '\n';
  }
}

/* ========= הרצה ========= */

if (!process.argv[2]) {
  console.error('Missing input JSON file');
  process.exit(1);
}

const inputFile = process.argv[2];
//console.log("DEBUG: input file path:", inputFile);

const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
//console.log("DEBUG: input data keys:", Object.keys(data));
//console.log("DEBUG: rows length:", data.rows.length);

const msv = new msvwriter();
msv.setmsvconfig(
  data.institution_code,
  data.institution_name,
  ''
);

const result = msv.createmsv(data.rows);
// בוחרים שם ומיקום לקובץ
/*const outputFile = `C:/xampp/htdocs/dev_s/masav/${data.institution_code}_${Date.now()}.001`;

// שומרים את הפלט לקובץ
fs.writeFileSync(outputFile, result, 'utf8');

console.log("✅ MSV file saved to:", outputFile);*/

//console.log("DEBUG: final result length:", result.length);
process.stdout.write(result);
