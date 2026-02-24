<?php
session_start();
include 'afuncs.php';
header('Content-Type: application/json; charset=utf-8');

// רשימת הפונקציות המותרות לשימוש ב-API
$allowed_functions = [
    "get_tosafot"    => "get_tosafot",
    "update_tosafot" => "update_tosafot",
    "add_tosefet"    =>  "add_tosefet",

    "getall_tarifim" => "getall_tarifim",
    "add_tarif"      => "add_tarif",
    "getall_snifim"  => "getall_snifim",
    "getall_av"  => "getall_av",

    "ldatetohebdate" => "ldatetohebdate",
    "save_tests" => "save_tests",
    "hebtold" => "hebtold",
    "get_av_by_snif" => "get_av_by_snif",
    "getall_kvutzot" => "getall_kvutzot",
    "get_av_by_snif_group" => "get_av_by_snif_group",
    "get_av_filtered" => "get_av_filtered",

    "getall_groups" => "getall_groups",

    "add_fix" => "add_fix",

    "get_fix_totals" => "get_fix_totals",
    "get_tarif_for_avrech_and_date" => "get_tarif_for_avrech_and_date",
    "isTosefet" => "isTosefet",
    "get_fixes_for_avrech" => "get_fixes_for_avrech",
    "update_payment_fix_sum" => "update_payment_fix_sum",

    "save_or_fix_payments" => "save_or_fix_payments",
    
    //"apply_fix_and_update_payment" => "apply_fix_and_update_payment",
    "apply_fix_and_update_payment" => function($p) {
        return apply_fix_and_update_payment($p);
    },
    
    "get_tarif_for_date" => "get_tarif_for_date",
    "calc_tikun_amount" => "calc_tikun_amount",
    "calc_extra_tikun" => "calc_extra_tikun",
    "get_tav_kniya_kvuim" => "get_tav_kniya_kvuim",

    "save_tav_kniya_kavua" => "save_tav_kniya_kavua",
    "save_fixed_tavim" => "save_fixed_tavim",

    "update_deposits_from_payments" => "update_deposits_from_payments",
    "other_deposit" => "other_deposit",
    
    "createMilga" => "createMilga",
    "applyGeneralDepositToTashlumim" => "applyGeneralDepositToTashlumim",

    "get_masav_rows" => "get_masav_rows",
    "create_masav_files" => "create_masav_files",

    // הוסיפי כאן פונקציות נוספות לפי הצורך
];

function runfromfetch($allowed_functions)
{
    ini_set('display_errors', 1);
    error_reporting(E_ALL);

    $mpost = json_decode(file_get_contents('php://input'), true);

    if (!$mpost || !isset($mpost['fn'])) {
        echo json_encode(['ok' => false, 'error' => 'Missing fn parameter']);
        return;
    }

    $func = $mpost['fn'];
    $params = $mpost['params'] ?? [];
    //error_log("fn: " . $fn . " | params: " . json_encode($postdata));

    if (isset($allowed_functions[$func])) {
        $handler = $allowed_functions[$func];
    
        if (is_callable($handler)) {
            $result = $handler($params);
            echo json_encode($result);
        } else {
            echo json_encode(['ok' => false, 'error' => "Handler for '$func' is not callable"]);
        }
    } else {
        echo json_encode(['ok' => false, 'error' => "Function '$func' not exists or not allowed"]);
    }
    
    
    
}

runfromfetch($allowed_functions);
