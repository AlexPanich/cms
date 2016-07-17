@extends('layouts.dashboard')

@section('page_title')
    Страницы
@endsection

@section('content_title')
    Создание новой страницы
@endsection

@include('dashboard.editor')

@inject('menu', 'App\Menu')
@inject('template, 'App\Template')

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('add_page') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label for="parent_id" class="control-label">Раздел</label>
            <div class="controls">
                <select class="form-control " name="parent_id" id="parent_id">
                    <option value="0">Без раздела</option>
                    @tree($tree)
                </select>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="url">Адрес страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="url" id="url" value="{{ old('url') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title_in_menu">Заголовок в меню</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title_in_menu" id="title_in_menu" value="{{ old('title_in_menu') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title">Заголовок страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="keywords">Ключевые слова</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="keywords" id="keywords" value="{{ old('keywords') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="description">Описание страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="description" id="description" value="{{ old('description') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label for="menu_id" class="control-label">Меню</label>
            <div class="controls">
                <select class="form-control " name="menu_id" id="menu_id">
                    <option value="0">Иерархическое</option>
                    @foreach($menu->all() as $item)
                        <option value="{{ $item->id }}"
                        @if($item->id == old('menu_id'))
                            selected
                        @endif
                        >{{ $item->title }}</option>
                    @endforeach
                </select>
            </div>
        </div>
        <div class="control-group">
            <label for="template_id" class="control-label">Шаблон страницы</label>
                <span class="controls">
                    <select class="form-control" name=template_id id="template_id">
                        @foreach($template->all() as $template)
                            <option value="{{ $template->id }}"
                            @if($template->id == old('template_id'))
                                selected
                            @endif
                            >{{ $template->name }}</option>
                        @endforeach
                    </select>
                </span>
            </label>
        </div>
        <br>
        <textarea class="form-control" name="content" id="replace" rows="10">{!! old('content') !!}</textarea>
        <br>
        <div class="control-group">
        <label class="css-input switch switch-sm switch-primary">
            <input type="checkbox" name="is_show" {{ count($errors) == 0 || old('is_show') ? 'checked' : '' }}>
            <span></span>
            Отображать на сайте
        </label>
        </div>
        <br>
        <p>
            <input type="submit" value="Создать страницу" class="btn btn-primary btn-square">
            <a class="btn btn-default btn-square" href="{{ route('all_articles') }}">Все статьи (уйти не сохранив)</a>
        </p>
    </form>
@endsection