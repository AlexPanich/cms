@extends('layouts.dashboard')

@section('page_title')
    Меню
@endsection

@section('content_title')
    Редактирование меню
@endsection

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('update_menu', $menu->id) }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="title">Название меню</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title', $menu->title) }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="pages">Добавить страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <select name="pages[]" id="pages" multiple>
                        @menu_tree($tree, $menu)
                    </select>
                </div>
            </div>
        </div>
        <br>
         <p>
            <input type="submit" value="Сохранить меню" class="btn btn-primary btn-square">
            <a class="btn btn-default btn-square" href="{{ route('all_menu') }}">Все меню (уйти не сохранив)</a>
        </p>
    </form>
@endsection