<?php

function print_tree($tree, $page_id, $shift = 0)
{
    if (!empty($tree)) {
        foreach ($tree as $section) {
            ?>
        <option value="<?= $section['id'] ?>"
            <?php if ($page_id == $section['id']) echo 'selected' ?>
        >
            <?php for ($i = 0; $i < $shift; $i++) echo '&nbsp;'; ?>
            <?= $section['title_in_menu'] ?></option><?php
            print_tree($section['children'], $page_id, $shift + 5);

        }
    }
}


function print_menu_tree($tree, $pages, $shift = 0)
{
    if (!$pages) $pages = [];
    if (!empty($tree)) {
        foreach ($tree as $section) {
            ?>
        <option value="<?= $section['id'] ?>"
            <?php if (in_array($section['id'], $pages)) echo 'selected' ?>
        >
            <?php for ($i = 0; $i < $shift; $i++) echo '&nbsp;'; ?>
            <?= $section['title_in_menu'] ?></option><?php
            print_menu_tree($section['children'], $pages, $shift + 5);

        }
    }
}


function unique_name($dir, $name, $translit = false)
{
    $name = preg_replace('/[:\/\"]+/', '', $name);
    $temp = explode(DIRECTORY_SEPARATOR, $name);
    $name = end($temp);

    if ($name == '') {
        return '';
    }

    $temp = explode(' ', $name);
    $name = implode('_', $temp);

    if ($translit) {
        $name = make_tarnslit($name);
    }

    if (file_exists($dir . DIRECTORY_SEPARATOR . $name)) {

        $temp = explode('.', $name);
        $ext = array_pop($temp);
        $i = 1;
        $str = "($i)";
        $name = implode('.', $temp) . $str . ".$ext";

        while (file_exists($dir . DIRECTORY_SEPARATOR . $name)) {
            $i++;
            $str = "($i)";
            $name = implode('.', $temp) . $str . ".$ext";
        }
    }

    return $name;
}

define('HASH_KEY', 'JLkjOlkielOIn342JM(j90');

function get_hash($str)
{
    $i = 0;
    while ($i++ < 4)
        $str = md5(md5($str . HASH_KEY) . $str);

    return $str;
}

function make_tarnslit($str)
{
    $converter = [
        'а' => 'a', 'б' => 'b', 'в' => 'v',

        'г' => 'g', 'д' => 'd', 'е' => 'e',

        'ё' => 'e', 'ж' => 'zh', 'з' => 'z',

        'и' => 'i', 'й' => 'y', 'к' => 'k',

        'л' => 'l', 'м' => 'm', 'н' => 'n',

        'о' => 'o', 'п' => 'p', 'р' => 'r',

        'с' => 's', 'т' => 't', 'у' => 'u',

        'ф' => 'f', 'х' => 'h', 'ц' => 'c',

        'ч' => 'ch', 'ш' => 'sh', 'щ' => 'sch',

        'ь' => '\'', 'ы' => 'y', 'ъ' => '\'',

        'э' => 'e', 'ю' => 'yu', 'я' => 'ya',


        'А' => 'A', 'Б' => 'B', 'В' => 'V',

        'Г' => 'G', 'Д' => 'D', 'Е' => 'E',

        'Ё' => 'E', 'Ж' => 'Zh', 'З' => 'Z',

        'И' => 'I', 'Й' => 'Y', 'К' => 'K',

        'Л' => 'L', 'М' => 'M', 'Н' => 'N',

        'О' => 'O', 'П' => 'P', 'Р' => 'R',

        'С' => 'S', 'Т' => 'T', 'У' => 'U',

        'Ф' => 'F', 'Х' => 'H', 'Ц' => 'C',

        'Ч' => 'Ch', 'Ш' => 'Sh', 'Щ' => 'Sch',

        'Ь' => '\'', 'Ы' => 'Y', 'Ъ' => '\'',

        'Э' => 'E', 'Ю' => 'Yu', 'Я' => 'Ya',

    ];

    return strtr($str, $converter);
}