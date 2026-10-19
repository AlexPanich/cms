<?php

namespace App\Http\Requests;

use App\Http\Requests\Request;

class PageRequest extends Request
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'url' => 'required',
            'parent_id' => 'required',
            'title' => 'required',
            'title_in_menu' => 'required',
            'content' => 'required',
            'menu_id' => 'required'
        ];
    }
}
