@extends('layouts.dashboard')

@section('page_title')
    Меню
@endsection

@section('content_title')
    Список меню
@endsection

@section('content')
    <ul class="list-group">
    @foreach($menu as $item)
        <li class="list-group-item">
            <a href="{{ route('edit_menu', $item->id) }}">{{ $item['title'] }}</a> |
            <a href="{{ route('sort_menu', $item->id) }}">сортировать</a>
        </li>
    @endforeach
    </ul>
@endsection