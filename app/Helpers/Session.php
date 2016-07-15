<?php


namespace App\Helpers;


class Session
{
    public static function push($name, $value)
    {
        $_SESSION[$name] = $value;
    }

    public static function read($name)
    {
        return $_SESSION[$name];
    }

    public static function slice($name)
    {
        $value = $_SESSION[$name];
        unset($_SESSION[$name]);
        return $value;
    }

    public static function has($name)
    {
        return isset($_SESSION[$name]);
    }

    public static function kick($names)
    {
        foreach($names as $name)
            unset($_SESSION[$name]);
    }
}