<?php

namespace App\Modules;


use Config;
use DB;

class Search
{
    protected $search_map;

    public function __construct($search_map)
    {
        $this->search_map = $search_map;
    }

    public function find($string)
    {
        if($string == '') {
            throw new \Exception('пустая строка');
        }

        $string = preg_replace('/[|%_\']+/', '', $string);
        $string = htmlentities($string);
        $result =[];

        foreach($this->search_map as $key => $table) {
            if(count($table['fields'] > 0)) {
                $where = $this->createCondition($table['fields'], $string);
                $and_where = key_exists('where', $table) && $table['where'] != '' ? ' AND ' . $table['where'] : '';
                $query = 'SELECT * FROM ' . $key . ' WHERE (' . $where . ')' . $and_where . ';';
                $result[$key] = DB::select($query);
            }
        }
        return $result;
    }

    private function createCondition($fields, $string)
    {
        $sets = [];

        foreach($fields as $field) {
            $sets[] = "$field LIKE '%$string%'";
        }

        return implode(' OR ', $sets);
    }

    public function getTemplate($table)
    {
        return $this->search_map[$table]['template'];
    }
}