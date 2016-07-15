<?php
/**
 * Created by PhpStorm.
 * User: User
 * Date: 023 23.05.16
 * Time: 9:22
 */

namespace App;


trait SimpleEditTrait
{
    public function simpleEdit(array $attributes)
    {
        $newAttributes = [];
        foreach($attributes as $key => $value) {
            if ($this[$key] != $value) {
                $newAttributes[$key] = $value;
            }
        }
        return parent::update($newAttributes);
    }

}