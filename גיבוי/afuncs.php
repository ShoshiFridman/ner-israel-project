<?php
include_once 'dbq.php';

function getall_av($p)
{
    $sql = 'select * from אברכים where משפחה IS NOT NULL ORDER BY משפחה,פרטי limit 3000';
    return queryasarray($sql);
}

function getall_snifim($p)
{
    return queryasarray('SELECT "סניף_id", "שם סניף" FROM "סניפים" ORDER BY "שם סניף"');
}

function getall_tarifim($p)
{
    $sql = 'SELECT t.*, s."שם סניף" FROM "תעריפים" t
            LEFT JOIN "סניפים" s ON t."קוד סניף" = s."סניף_id"
            ORDER BY t."סטטוס" DESC, t."תאריך סיום" ';
            
    return queryasarray($sql);
}

function add_tarif($p)
{
    $kod_snif = $p['קוד סניף'];
    $ldate = $p['תאריך התחלה'];

    // בודקים אם קיים תעריף פעיל לסניף
    $sql_check = 'SELECT 1 FROM "תעריפים" WHERE "קוד סניף" = $1 AND "סטטוס" = $2 LIMIT 1';
    $exists = queryasarray($sql_check, [$kod_snif, 'כן']);

    if ($exists) {
        // מעדכנים את התעריף הקודם ל"לא" ומכניסים תאריך סיום
        $update_sql = 'UPDATE "תעריפים" SET "סטטוס" = $1, "תאריך סיום" = $2 
                       WHERE "קוד סניף" = $3 AND "סטטוס" = $4';
        doq($update_sql, ['לא', $ldate, $kod_snif, 'כן']);
    }

    // הכנסה של תעריף חדש
    $fields = array_keys($p);
    $values = array_values($p);

    $placeholders = [];
    for ($i = 0; $i < count($fields); $i++) {
        $placeholders[] = '$' . ($i + 1);
    }

    $sql = 'INSERT INTO "תעריפים" ("' . implode('","', $fields) . '") VALUES (' . implode(',', $placeholders) . ')';
    doq($sql, $values);

    return ['ok' => true];
}

function deactivate_old_tarif($p)
{
    $snif = $p["קוד סניף"];
    $new_start_date = $p["תאריך התחלה"];

    $sql = 'UPDATE "תעריפים" 
            SET "סטטוס" = $1, "תאריך סיום" = $2 
            WHERE "קוד סניף" = $3 AND "סטטוס" = $4';
    $params = ['לא', $new_start_date, $snif, 'כן'];

    doq($sql, $params);
    return ["status" => "ok"];
}

function ldatetohebdate($p)
{
    if (!isset($p['ldate'])) {
        return ['error' => 'חסר תאריך'];
    }

    $ldate = $p['ldate']; // פורמט YYYY-MM-DD
    $parts = explode('-', $ldate);
    if (count($parts) !== 3) {
        return ['error' => 'פורמט תאריך לא תקני'];
    }

    list($year, $month, $day) = $parts;
    $jd = gregoriantojd((int)$month, (int)$day, (int)$year);
    if (!$jd) {
        return ['error' => 'תאריך לועזי שגוי'];
    }

    $hebDate = explode('/', jdtojewish($jd));
    if (count($hebDate) !== 3) {
        return ['error' => 'שגיאה בהמרה לעברי'];
    }

    list($hMonth, $hDay, $hYear) = $hebDate;

    $monthNames = [
        1 => 'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט',
        'אדר א', 'אדר ב', 'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול'
    ];

    $hebMonthName = $monthNames[(int)$hMonth] ?? "חודש לא ידוע";

    // המרת היום לגימטריה (היום בעברית באותיות)
    $hebDayGimatria = gematria_hebrew_year_day((int)$hDay);

    $hebYearText = gematria_hebrew_year((int)$hYear);
    $text = "$hebDayGimatria ב$hebMonthName $hebYearText";

    return [
        'd' => (int)$hDay,
        'm' => (int)$hMonth,
        'y' => (int)$hYear,
        'text' => $text
    ];
}

// פונקציה להמרת מספר יום לגימטריה (יום בשנה, עד 30)
function gematria_hebrew_year_day($day)
{
    $letters = [
        400 => "ת", 300 => "ש", 200 => "ר", 100 => "ק",
        90 => "צ", 80 => "פ", 70 => "ע", 60 => "ס",
        50 => "נ", 40 => "מ", 30 => "ל", 20 => "כ", 10 => "י",
        9 => "ט", 8 => "ח", 7 => "ז", 6 => "ו", 5 => "ה",
        4 => "ד", 3 => "ג", 2 => "ב", 1 => "א"
    ];

    $result = "";
    foreach ($letters as $value => $letter) {
        while ($day >= $value) {
            $result .= $letter;
            $day -= $value;
        }
    }

    // תיקונים מיוחדים לגימטריה של 15 ו-16
    $result = str_replace(["יה", "יו"], ["טו", "טז"], $result);

    return $result;
}



function hebtold($p)
{
    if (!isset($p['hdate'])) {
        return ['error' => 'Missing hdate parameter'];
    }
    $hdate = $p['hdate'];
    $parts = explode('-', $hdate);

    if (count($parts) == 3) {
        // תאריך מלא: יום-חודש-שנה
        list($day, $month, $year) = $parts;
    } elseif (count($parts) == 2) {
        // רק חודש-שנה - נניח היום הוא 1
        $day = 1;
        list($month, $year) = $parts;
    } else {
        return ['error' => 'Invalid Hebrew date format'];
    }

    // אם החודש עברי הוא בשם (כמו 'תמוז') - נמיר למספר
    if (!is_numeric($month)) {
        $monthNames = [
            'תשרי' => 1, 'חשוון' => 2, 'כסלו' => 3, 'טבת' => 4, 'שבט' => 5,
            'אדר א' => 6, 'אדר א׳' => 6, 'אדר א׳' => 6, 'אדר ב' => 7, 'אדר ב׳' => 7,
            'ניסן' => 8, 'אייר' => 9, 'סיוון' => 10, 'תמוז' => 11, 'אב' => 12, 'אלול' => 13
        ];

        $month = trim($month);
        if (isset($monthNames[$month])) {
            $month = $monthNames[$month];
        } else {
            return ['error' => 'Unknown Hebrew month name'];
        }
    }

    // המרה ל־int
    $day = (int)$day;
    $month = (int)$month;
    $year = (int)$year;

    $jd = jewishtojd($month, $day, $year);
    if (!$jd) {
        return ['error' => 'Invalid Hebrew date'];
    }

    $gregDate = jdtogregorian($jd); // MM/DD/YYYY
    $gregParts = explode('/', $gregDate);
    if (count($gregParts) !== 3) {
        return ['error' => 'Error parsing Gregorian date'];
    }
    list($m, $d, $y) = $gregParts;
    $ldate = sprintf('%04d-%02d-%02d', $y, $m, $d);

    return ['ldate' => $ldate];
}


function gematria_hebrew_year($year)
{
    $num = intval($year) % 1000; // מחזיר את שלושת הספרות האחרונות של השנה

    $letters = [
        400 => "ת", 300 => "ש", 200 => "ר", 100 => "ק",
        90 => "צ", 80 => "פ", 70 => "ע", 60 => "ס",
        50 => "נ", 40 => "מ", 30 => "ל", 20 => "כ", 10 => "י",
        9 => "ט", 8 => "ח", 7 => "ז", 6 => "ו", 5 => "ה",
        4 => "ד", 3 => "ג", 2 => "ב", 1 => "א"
    ];

    $result = "";

    foreach ($letters as $value => $letter) {
        while ($num >= $value) {
            $result .= $letter;
            $num -= $value;
        }
    }

    // תיקונים מיוחדים לגימטריה של 15 ו-16
    // לפי המסורת היהודית כדי לא לכתוב יה ויו אלא טו ו-טז
    $result = str_replace(["יה", "יו"], ["טו", "טז"], $result);

    return $result;
}
function get_tosafot($p) {
    return queryasarray('SELECT * FROM "תוספות" ORDER BY "id"');
}

function update_tosafot($p) {
    $fixed = ($p['קבוע'] === true || $p['קבוע'] === 'true' || $p['קבוע'] === 't' || $p['קבוע'] === 1) ? 't' : 'f';

    $sql = 'UPDATE "תוספות" SET "תעריף" = $1, "קבוע" = $2 WHERE "id" = $3';
    doq($sql, [$p['תעריף'], $fixed, $p['id']]);
    return ['ok' => true];
}
function add_tosefet($p) {
    error_log('add_tosefet נקראה עם הפרמטרים: ' . print_r($p, true));

    try {
        if (isset($p['קבוע'])) {
            $p['קבוע'] = ($p['קבוע'] === true || $p['קבוע'] === 'true' || $p['קבוע'] === 't' || $p['קבוע'] === 1) ? 't' : 'f';
        } else {
            $p['קבוע'] = 'f'; // ברירת מחדל ל'לא'
        }

        $fields = array_keys($p);
        $values = array_values($p);

        $placeholders = [];
        for ($i = 0; $i < count($fields); $i++) {
            $placeholders[] = '$' . ($i + 1);
        }

        $sql = 'INSERT INTO "תוספות" ("' . implode('","', $fields) . '") VALUES (' . implode(',', $placeholders) . ')';

        $id = doqinsert($sql, $values);

        if ($id) {
            return ['ok' => true, 'id' => $id];
        } else {
            return ['ok' => false, 'error' => 'Insertion failed: no ID returned'];
        }

    } catch (Exception $e) {
        error_log('Exception in add_tosefet: ' . $e->getMessage());
        return ['ok' => false, 'error' => 'Exception: ' . $e->getMessage()];
    }
}

//מבחנים

function get_av_by_snif($p) {
    $snif_id = $p['snif_id'] ?? null;
    if (!$snif_id) return [];

    $sql = 'SELECT a.*
            FROM "אברכים" a
            JOIN "קבוצות" k ON a."קבוצה" = k."שם"
            WHERE k."מספר" = $1
              AND a."משפחה" IS NOT NULL
            ORDER BY a."משפחה", a."פרטי"
            LIMIT 3000';

    return queryasarray($sql, [$snif_id]);
}
function getall_kvutzot($p)
{
    return queryasarray('SELECT "מספר", "שם" FROM "קבוצות" ORDER BY "שם"');
}

// קבלת אברכים לפי סניף + קבוצה (עם טיפול בparam קבוצה ריק)
function get_av_by_snif_group($p) {
    $snif_id = $p['snif_id'] ?? null;
    $group_num = $p['group_num'] ?? null;

    if (!$snif_id) return [];

    if ($group_num) {
        $sql = 'SELECT a.* FROM "אברכים" a
                JOIN "קבוצות" k ON a."קבוצה" = k."שם"
                WHERE k."מספר" = $1
                AND a."משפחה" IS NOT NULL
                ORDER BY a."משפחה", a."פרטי"
                LIMIT 3000';
        return queryasarray($sql, [$group_num]);
    } else {
        
        $sql = 'SELECT * FROM "אברכים" WHERE "משפחה" IS NOT NULL ORDER BY "משפחה", "פרטי" LIMIT 3000';
        return queryasarray($sql);
    }
}

function get_av_filtered($p) {
    $snif_id = $p['snif_id'] ?? null;
    $group_name = $p['group_name'] ?? null;
    $month_name = $p['month_name'] ?? null;
    $year_hebrew = $p['year_hebrew'] ?? null;

    $params = [];
    $where = ['a."משפחה" IS NOT NULL'];
    $i = 1;

    if ($group_name) {
        $where[] = 'k."שם" = $' . $i++;
        $params[] = $group_name;
    } elseif ($snif_id) {
        $where[] = 'k."סניף_id" = $' . $i++;
        $params[] = $snif_id;
    }

    $sql = 'SELECT a."אברך_id", a."משפחה", a."פרטי", a."קבוצה", k."סניף_id",
                   COALESCE(t."weekly_count", 0) AS weekly_count,
                   COALESCE(t."monthly_test", false) AS monthly_test
            FROM "אברכים" a
            JOIN "קבוצות" k ON a."קבוצה" = k."שם"
            LEFT JOIN test_summary t
              ON t."avrech_id" = a."אברך_id"
              AND t."month_name" = $' . $i++ . '
              AND t."year_hebrew" = $' . $i++ . '
            WHERE ' . implode(" AND ", $where) . '
            ORDER BY a."משפחה", a."פרטי"
            LIMIT 3000';

    $params[] = $month_name;
    $params[] = $year_hebrew;

    return queryasarray($sql, $params);
}






function getall_groups($p) {
    // מחזיר גם את סניף_id לכל קבוצה
    $sql = 'SELECT "מספר", "שם", "סניף_id" FROM "קבוצות" ORDER BY "שם"';
    return queryasarray($sql);
}



function save_tests($payload) {
    global $db;

    if (!$db) {
        $db = connect();
    }

    static $prepared = false;
    if (!$prepared) {
        pg_prepare($db, "save_test_stmt", "INSERT INTO test_summary 
    (avrech_id, month_name, year_hebrew, weekly_count, monthly_test, ldate)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (avrech_id, month_name, year_hebrew) DO UPDATE SET
      weekly_count = EXCLUDED.weekly_count,
      monthly_test = EXCLUDED.monthly_test,
      ldate = COALESCE(EXCLUDED.ldate, test_summary.ldate)");

        $prepared = true;
    }

    foreach ($payload as $row) {
        $avrech_id = (int)$row['avrech_id'];
        $month_name = $row['month_name'];
        $year_hebrew = $row['year_hebrew'];
        $weekly_count = (int)$row['weekly_count'];
        $monthly_test = $row['monthly_test'] ? 'true' : 'false';

        // אם ldate ריק או לא קיים, נשלח NULL ל-Postgres
        $ldate = isset($row['ldate']) && $row['ldate'] !== '' ? $row['ldate'] : null;
        error_log("תאריך לועזי שנשלח: " . var_export($ldate, true));

        $result = pg_execute($db, "save_test_stmt", [$avrech_id, $month_name, $year_hebrew, $weekly_count, $monthly_test, $ldate]);
        if (!$result) {
            error_log("שגיאה בשמירה: " . pg_last_error($db));
        }    }

    return ['status' => 'ok'];
}
function get_tests_by_avrech_month($p) {
    $avrech_id = $p['avrech_id'] ?? null;
    $month_name = $p['month_name'] ?? null;
    $year_hebrew = $p['year_hebrew'] ?? null;

    if (!$avrech_id || !$month_name || !$year_hebrew) {
        return ['error' => 'Missing parameters'];
    }

    $sql = 'SELECT * FROM test_summary WHERE avrech_id = $1 AND month_name = $2 AND year_hebrew = $3';
    $results = queryasarray($sql, [$avrech_id, $month_name, $year_hebrew]);
    return $results ? $results[0] : null;
}
